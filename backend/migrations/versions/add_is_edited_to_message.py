"""add is_edited to message

Revision ID: 5678901234ab
Revises: 4567890123ab
Create Date: 2026-03-25 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5678901234ab'
down_revision: Union[str, None] = '4567890123ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('Message', sa.Column('is_edited', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('Message', 'is_edited')
