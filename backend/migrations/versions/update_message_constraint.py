"""update message constraint

Revision ID: 2345678901ab
Revises: 1234567890ab
Create Date: 2026-03-24 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2345678901ab'
down_revision: Union[str, None] = '1234567890ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('message_has_content', 'Message', type_='check')
    op.create_check_constraint(
        'message_has_content',
        'Message',
        'is_deleted OR content IS NOT NULL OR "imgUrl" IS NOT NULL'
    )


def downgrade() -> None:
    op.drop_constraint('message_has_content', 'Message', type_='check')
    op.create_check_constraint(
        'message_has_content',
        'Message',
        'content IS NOT NULL OR "imgUrl" IS NOT NULL'
    )
