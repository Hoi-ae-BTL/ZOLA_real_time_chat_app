from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import shutil
from pathlib import Path

from backend.app.api import deps
from backend.app.db.base import User
from backend.app.services import message_service
from backend.app.schemas.message import MessageCreate

router = APIRouter(prefix="/api/upload", tags=["Upload"])

# Correctly define UPLOAD_DIR relative to the current file
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/file")
async def upload_file_and_create_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    conversation_id: str,
    file: UploadFile = File(...),
):
    """
    Uploads a file and creates a message with the file URL.
    """
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{file.filename}"

    if file.content_type.startswith("image/"):
        message_in = MessageCreate(
            conversation_id=conversation_id,
            content=None,
            img_url=file_url,
        )
    else:
        message_in = MessageCreate(
            conversation_id=conversation_id,
            content=None,
            file_url=file_url,
            file_name=file.filename,
        )

    await message_service.create_message(
        db=db, message_in=message_in, sender=current_user
    )

    return {"filename": file.filename, "url": file_url}
