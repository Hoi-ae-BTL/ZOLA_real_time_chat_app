from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import shutil
from pathlib import Path
from typing import List

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
    Uploads a single file (image or document) and creates a message.
    """
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{file.filename}"

    if file.content_type.startswith("image/"):
        message_in = MessageCreate(
            conversation_id=conversation_id,
            content=None,
            img_url=[file_url],  # Send as a list with one element
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

@router.post("/images")
async def upload_images_and_create_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    conversation_id: str,
    files: List[UploadFile] = File(...),
):
    """
    Uploads multiple images and creates a single message with a list of their URLs.
    """
    img_urls = []
    for file in files:
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' is not an image.",
            )
        
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        img_urls.append(f"/uploads/{file.filename}")

    message_in = MessageCreate(
        conversation_id=conversation_id,
        content=None,
        img_url=img_urls,
    )
    await message_service.create_message(
        db=db, message_in=message_in, sender=current_user
    )

    return {"filenames": [file.filename for file in files], "urls": img_urls}
