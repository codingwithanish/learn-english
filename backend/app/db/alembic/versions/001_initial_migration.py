"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-08-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types - use IF NOT EXISTS to avoid conflicts
    op.execute("DO $$ BEGIN CREATE TYPE logintype AS ENUM ('GOOGLE', 'FACEBOOK', 'INSTAGRAM'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE usertype AS ENUM ('TUTOR', 'ADMIN', 'STUDENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE userplan AS ENUM ('FREE', 'PREMIUM'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE userstatus AS ENUM ('ACTIVE', 'BLOCKED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE resourcetype AS ENUM ('VOCABULARY', 'PHRASE', 'GRAMMAR'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE resourcestatus AS ENUM ('ACTIVE', 'BLOCKED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE speakresourcestatus AS ENUM ('INITIATED', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE speakresourcetype AS ENUM ('SUBJECT_SPEAK', 'CONVERSATION'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE initiatedresourcetype AS ENUM ('TUTOR', 'STUDENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE actiontype AS ENUM ('text', 'speak'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE referencetable AS ENUM ('text_resources', 'speak_resources'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE impressiontype AS ENUM ('NEW', 'EXISTING'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create user_details table
    op.create_table('user_details',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('login_type', sa.Enum('GOOGLE', 'FACEBOOK', 'INSTAGRAM', name='logintype'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('user_email', sa.String(), nullable=True),
        sa.Column('profession', sa.String(), nullable=True),
        sa.Column('communication_level', sa.String(), nullable=True),
        sa.Column('targetting', sa.String(), nullable=True),
        sa.Column('mobile', sa.String(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('type', sa.Enum('TUTOR', 'ADMIN', 'STUDENT', name='usertype'), nullable=False),
        sa.Column('plan', sa.Enum('FREE', 'PREMIUM', name='userplan'), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'BLOCKED', name='userstatus'), nullable=False, default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_details_user_email'), 'user_details', ['user_email'], unique=True)
    op.create_index(op.f('ix_user_details_type'), 'user_details', ['type'], unique=False)
    op.create_index(op.f('ix_user_details_status'), 'user_details', ['status'], unique=False)
    
    # Create text_resources table
    op.create_table('text_resources',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('type', sa.Enum('VOCABULARY', 'PHRASE', 'GRAMMAR', name='resourcetype'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('examples', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_favorate', sa.Boolean(), nullable=True, default=False),
        sa.Column('impressions', sa.Integer(), nullable=True, default=0),
        sa.Column('tutor_ratings', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True, default=0),
        sa.Column('status', sa.Enum('ACTIVE', 'BLOCKED', name='resourcestatus'), nullable=True, default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user_details.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create speak_resources table
    op.create_table('speak_resources',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('INITIATED', 'COMPLETED', name='speakresourcestatus'), nullable=False),
        sa.Column('expiry', sa.DateTime(), nullable=True),
        sa.Column('output_resource_location', sa.String(), nullable=True),
        sa.Column('input_resource_location', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('evaluation_result', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('resource_config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('type', sa.Enum('SUBJECT_SPEAK', 'CONVERSATION', name='speakresourcetype'), nullable=False),
        sa.Column('initiated_resource', sa.Enum('TUTOR', 'STUDENT', name='initiatedresourcetype'), nullable=False),
        sa.Column('created_date', sa.DateTime(), nullable=True),
        sa.Column('completed_date', sa.DateTime(), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user_details.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_history table
    op.create_table('user_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_time', sa.DateTime(), nullable=True),
        sa.Column('action_type', sa.Enum('text', 'speak', name='actiontype'), nullable=False),
        sa.Column('user_query', sa.Text(), nullable=True),
        sa.Column('corrected_query', sa.Text(), nullable=True),
        sa.Column('corrected_description', sa.Text(), nullable=True),
        sa.Column('is_valid', sa.Boolean(), nullable=True, default=True),
        sa.Column('reference_table', sa.Enum('text_resources', 'speak_resources', name='referencetable'), nullable=True),
        sa.Column('type_of_impression', sa.Enum('NEW', 'EXISTING', name='impressiontype'), nullable=True),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user_details.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create student_tutor_mapping table
    op.create_table('student_tutor_mapping',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tutor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('joining_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['user_details.id'], ),
        sa.ForeignKeyConstraint(['tutor_id'], ['user_details.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'tutor_id', name='unique_student_tutor')
    )
    
    # Create user_favorites table
    op.create_table('user_favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_type', sa.Enum('text', 'speak', name='actiontype'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user_details.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create tutor_ratings table
    op.create_table('tutor_ratings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tutor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_type', sa.Enum('text', 'speak', name='actiontype'), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tutor_id'], ['user_details.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('tutor_ratings')
    op.drop_table('user_favorites')
    op.drop_table('student_tutor_mapping')
    op.drop_table('user_history')
    op.drop_table('speak_resources')
    op.drop_table('text_resources')
    op.drop_index(op.f('ix_user_details_status'), table_name='user_details')
    op.drop_index(op.f('ix_user_details_type'), table_name='user_details')
    op.drop_index(op.f('ix_user_details_user_email'), table_name='user_details')
    op.drop_table('user_details')
    
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS logintype")
    op.execute("DROP TYPE IF EXISTS usertype")
    op.execute("DROP TYPE IF EXISTS userplan")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS resourcetype")
    op.execute("DROP TYPE IF EXISTS resourcestatus")
    op.execute("DROP TYPE IF EXISTS speakresourcestatus")
    op.execute("DROP TYPE IF EXISTS speakresourcetype")
    op.execute("DROP TYPE IF EXISTS initiatedresourcetype")
    op.execute("DROP TYPE IF EXISTS actiontype")
    op.execute("DROP TYPE IF EXISTS referencetable")
    op.execute("DROP TYPE IF EXISTS impressiontype")