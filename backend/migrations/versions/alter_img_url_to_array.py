"""alter img_url to array

Revision ID: 6789012345ab
Revises: 5678901234ab
Create Date: 2026-03-25 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6789012345ab'
down_revision: Union[str, None] = '5678901234ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('Message', 'imgUrl',
               existing_type=sa.TEXT(),
               type_=sa.ARRAY(sa.Text()),
               existing_nullable=True,
               postgresql_using='"imgUrl"::text[]')


def downgrade() -> None:
    op.alter_column('Message', 'imgUrl',
               existing_type=sa.ARRAY(sa.Text()),
               type_=sa.TEXT(),
               existing_nullable=True)
