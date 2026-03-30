"""add is_hidden to conversation_participant

Revision ID: 3456789012ab
Revises: 2345678901ab
Create Date: 2026-03-24 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3456789012ab'
down_revision: Union[str, None] = '2345678901ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ConversationParticipant', sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('ConversationParticipant', 'is_hidden')
