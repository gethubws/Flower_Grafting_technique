"""MinIO Upload Service"""
from io import BytesIO
from minio import Minio
from minio.error import S3Error
from core.config import settings


_client: Minio | None = None


def get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
    return _client


def ensure_bucket() -> None:
    client = get_client()
    found = client.bucket_exists(settings.minio_bucket)
    if not found:
        client.make_bucket(settings.minio_bucket)
        print(f"📦 Created bucket: {settings.minio_bucket}")


def upload_image(object_name: str, image_bytes: bytes) -> str:
    """Upload image to MinIO, return public URL."""
    client = get_client()
    ensure_bucket()

    client.put_object(
        bucket_name=settings.minio_bucket,
        object_name=object_name,
        data=BytesIO(image_bytes),
        length=len(image_bytes),
        content_type="image/png",
    )

    protocol = "https" if settings.minio_secure else "http"
    return f"{protocol}://{settings.minio_endpoint}/{settings.minio_bucket}/{object_name}"
