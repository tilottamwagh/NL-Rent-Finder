"""initial tables

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'listings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('source_url', sa.String(), nullable=True),
        sa.Column('property_type', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('neighborhood', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('rent_price', sa.Float(), nullable=True),
        sa.Column('size_m2', sa.Float(), nullable=True),
        sa.Column('rooms', sa.Integer(), nullable=True),
        sa.Column('available_from', sa.String(), nullable=True),
        sa.Column('furnished', sa.Boolean(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('contact_info', sa.String(), nullable=True),
        sa.Column('landlord_name', sa.String(), nullable=True),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('hash_key', sa.String(), nullable=True),
        sa.Column('scraped_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('hash_key'),
    )

    op.create_table(
        'renter_queries',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('preferred_city', sa.String(), nullable=True),
        sa.Column('max_budget', sa.Float(), nullable=True),
        sa.Column('min_rooms', sa.Integer(), nullable=True),
        sa.Column('min_size_m2', sa.Float(), nullable=True),
        sa.Column('move_in_date', sa.String(), nullable=True),
        sa.Column('furnished_required', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('raw_query_text', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'matches',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('listing_id', sa.String(), nullable=True),
        sa.Column('query_id', sa.String(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('message_text', sa.Text(), nullable=True),
        sa.Column('notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ),
        sa.ForeignKeyConstraint(['query_id'], ['renter_queries.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'scraper_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('listings_found', sa.Integer(), nullable=True),
        sa.Column('listings_saved', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'ai_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(), nullable=True),
        sa.Column('model', sa.String(), nullable=True),
        sa.Column('api_key_openai', sa.String(), nullable=True),
        sa.Column('api_key_anthropic', sa.String(), nullable=True),
        sa.Column('api_key_gemini', sa.String(), nullable=True),
        sa.Column('api_key_groq', sa.String(), nullable=True),
        sa.Column('ollama_url', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('ai_settings')
    op.drop_table('scraper_logs')
    op.drop_table('matches')
    op.drop_table('renter_queries')
    op.drop_table('listings')
