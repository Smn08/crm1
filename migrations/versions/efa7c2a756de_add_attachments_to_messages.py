"""add_attachments_to_messages

Revision ID: efa7c2a756de
Revises: d14da5a17d79
Create Date: 2025-06-16 15:11:32.757407

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'efa7c2a756de'
down_revision: Union[str, None] = 'd14da5a17d79'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('message', sa.Column('attachments', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('message', 'attachments')
