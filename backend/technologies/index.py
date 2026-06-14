"""CRUD для раздела Технологии."""
import json
import os
import base64
import psycopg2
import boto3
from datetime import datetime


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    action = qs.get("action", "")

    # ── LIST ──────────────────────────────────────────────────────────────────
    if method == "GET" and not action:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT t.id, t.name, t.version, t.owner, t.status, t.description,
                   t.created_at, t.updated_at,
                   COALESCE(array_agg(DISTINCT tt.tag) FILTER (WHERE tt.tag IS NOT NULL), '{}') AS tags
            FROM technologies t
            LEFT JOIN tech_tags tt ON tt.technology_id = t.id
            GROUP BY t.id
            ORDER BY t.updated_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["tags"] = list(r["tags"]) if r["tags"] else []
        conn.close()
        return ok(rows)

    # ── GET ONE ───────────────────────────────────────────────────────────────
    if method == "GET" and action == "get":
        tech_id = qs.get("id")
        if not tech_id:
            return err("id required")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id,name,version,owner,status,description,created_at,updated_at FROM technologies WHERE id=%s", (tech_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("not found", 404)
        cols = ["id","name","version","owner","status","description","created_at","updated_at"]
        tech = dict(zip(cols, row))
        # tags
        cur.execute("SELECT id, tag FROM tech_tags WHERE technology_id=%s ORDER BY id", (tech_id,))
        tech["tags"] = [{"id": r[0], "tag": r[1]} for r in cur.fetchall()]
        # files
        cur.execute("SELECT id, filename, s3_key, content_type, size_bytes, created_at FROM tech_files WHERE technology_id=%s ORDER BY id", (tech_id,))
        cols2 = ["id","filename","s3_key","content_type","size_bytes","created_at"]
        tech["files"] = [dict(zip(cols2, r)) for r in cur.fetchall()]
        # mermaid
        cur.execute("SELECT id, title, content, created_at, updated_at FROM tech_mermaid WHERE technology_id=%s ORDER BY id", (tech_id,))
        cols3 = ["id","title","content","created_at","updated_at"]
        tech["mermaid"] = [dict(zip(cols3, r)) for r in cur.fetchall()]
        conn.close()
        return ok(tech)

    # ── CREATE ────────────────────────────────────────────────────────────────
    if method == "POST" and action == "create":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT nextval('tech_id_seq')")
        num = cur.fetchone()[0]
        new_id = f"tech-{num:03d}"
        cur.execute(
            "INSERT INTO technologies (id,name,owner,status,description) VALUES (%s,%s,%s,%s,%s)",
            (new_id, body.get("name","Новая технология"), body.get("owner",""), body.get("status","active"), body.get("description",""))
        )
        tags = body.get("tags", [])
        for tag in tags:
            cur.execute("INSERT INTO tech_tags (technology_id, tag) VALUES (%s,%s)", (new_id, tag))
        conn.commit()
        conn.close()
        return ok({"id": new_id}, 201)

    # ── UPDATE ────────────────────────────────────────────────────────────────
    if method == "PUT" and action == "update":
        tech_id = qs.get("id") or body.get("id")
        if not tech_id:
            return err("id required")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "UPDATE technologies SET name=%s, owner=%s, status=%s, description=%s, version=version+1 WHERE id=%s",
            (body.get("name"), body.get("owner"), body.get("status"), body.get("description"), tech_id)
        )
        # sync tags: replace all
        if "tags" in body:
            cur.execute("DELETE FROM tech_tags WHERE technology_id=%s", (tech_id,))
            for tag in body["tags"]:
                cur.execute("INSERT INTO tech_tags (technology_id,tag) VALUES (%s,%s)", (tech_id, tag))
        conn.commit()
        # return updated
        cur.execute("SELECT id,name,version,owner,status,description,updated_at FROM technologies WHERE id=%s", (tech_id,))
        row = cur.fetchone()
        conn.close()
        cols = ["id","name","version","owner","status","description","updated_at"]
        return ok(dict(zip(cols, row)))

    # ── DELETE ────────────────────────────────────────────────────────────────
    if method == "DELETE" and action == "delete":
        tech_id = qs.get("id")
        if not tech_id:
            return err("id required")
        conn = get_conn()
        cur = conn.cursor()
        # remove relations first
        cur.execute("DELETE FROM tech_tags WHERE technology_id=%s", (tech_id,))
        cur.execute("DELETE FROM tech_files WHERE technology_id=%s", (tech_id,))
        cur.execute("DELETE FROM tech_mermaid WHERE technology_id=%s", (tech_id,))
        cur.execute("DELETE FROM technologies WHERE id=%s", (tech_id,))
        conn.commit()
        conn.close()
        return ok({"deleted": tech_id})

    # ── ADD TAG ───────────────────────────────────────────────────────────────
    if method == "POST" and action == "add_tag":
        tech_id = body.get("technology_id")
        tag = body.get("tag", "").strip()
        if not tech_id or not tag:
            return err("technology_id and tag required")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("INSERT INTO tech_tags (technology_id,tag) VALUES (%s,%s) RETURNING id", (tech_id, tag))
        tag_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return ok({"id": tag_id, "tag": tag}, 201)

    # ── REMOVE TAG ────────────────────────────────────────────────────────────
    if method == "DELETE" and action == "remove_tag":
        tag_id = qs.get("tag_id")
        if not tag_id:
            return err("tag_id required")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM tech_tags WHERE id=%s", (tag_id,))
        conn.commit()
        conn.close()
        return ok({"deleted": tag_id})

    # ── ALL TAGS (autocomplete) ───────────────────────────────────────────────
    if method == "GET" and action == "all_tags":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT tag FROM tech_tags ORDER BY tag")
        tags = [r[0] for r in cur.fetchall()]
        conn.close()
        return ok(tags)

    # ── ADD MERMAID ───────────────────────────────────────────────────────────
    if method == "POST" and action == "add_mermaid":
        tech_id = body.get("technology_id")
        title = body.get("title", "Схема")
        content = body.get("content", "")
        if not tech_id:
            return err("technology_id required")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO tech_mermaid (technology_id,title,content) VALUES (%s,%s,%s) RETURNING id,title,content,created_at,updated_at",
            (tech_id, title, content)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        cols = ["id","title","content","created_at","updated_at"]
        return ok(dict(zip(cols, row)), 201)

    # ── UPDATE MERMAID ────────────────────────────────────────────────────────
    if method == "PUT" and action == "update_mermaid":
        mermaid_id = qs.get("mermaid_id") or body.get("mermaid_id")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "UPDATE tech_mermaid SET title=%s, content=%s WHERE id=%s RETURNING id,title,content,updated_at",
            (body.get("title","Схема"), body.get("content",""), mermaid_id)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"id": row[0], "title": row[1], "content": row[2], "updated_at": str(row[3])})

    # ── DELETE MERMAID ────────────────────────────────────────────────────────
    if method == "DELETE" and action == "delete_mermaid":
        mermaid_id = qs.get("mermaid_id")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM tech_mermaid WHERE id=%s", (mermaid_id,))
        conn.commit()
        conn.close()
        return ok({"deleted": mermaid_id})

    # ── UPLOAD FILE ───────────────────────────────────────────────────────────
    if method == "POST" and action == "upload_file":
        tech_id = body.get("technology_id")
        filename = body.get("filename", "file")
        content_type = body.get("content_type", "application/octet-stream")
        file_b64 = body.get("file_base64", "")
        if not tech_id or not file_b64:
            return err("technology_id and file_base64 required")
        file_bytes = base64.b64decode(file_b64)
        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )
        s3_key = f"technologies/{tech_id}/{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        s3.put_object(Bucket="files", Key=s3_key, Body=file_bytes, ContentType=content_type)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO tech_files (technology_id,filename,s3_key,content_type,size_bytes) VALUES (%s,%s,%s,%s,%s) RETURNING id,created_at",
            (tech_id, filename, cdn_url, content_type, len(file_bytes))
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"id": row[0], "filename": filename, "s3_key": cdn_url, "content_type": content_type, "size_bytes": len(file_bytes), "created_at": str(row[1])}, 201)

    # ── DELETE FILE ───────────────────────────────────────────────────────────
    if method == "DELETE" and action == "delete_file":
        file_id = qs.get("file_id")
        if not file_id:
            return err("file_id required")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM tech_files WHERE id=%s", (file_id,))
        conn.commit()
        conn.close()
        return ok({"deleted": file_id})

    return err("unknown action", 404)
