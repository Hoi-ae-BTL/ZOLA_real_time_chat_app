"""add file to message

Revision ID: 4567890123ab
Revises: 3456789012ab
Create Date: 2026-03-24 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4567890123ab'
down_revision: Union[str, None] = '3456789012ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('Message', sa.Column('fileUrl', sa.Text(), nullable=True))
    op.add_column('Message', sa.Column('fileName', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('Message', 'fileName')
    op.drop_column('Message', 'fileUrl')
