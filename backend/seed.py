# NOTIFCATION!
# this file generated the inititate data in our dâtbase
# this code follows the sqalchemy format
# the schema is in the ./app/db/base.py




import asyncio
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Import your models from your base.py file
from app.db.base import (
    User, 
    Conversation, 
    ConversationType, 
    ConversationParticipant, 
    Message
)

# 1. Database Connection URL
DATABASE_URL = "postgresql+asyncpg://chatapp_user:123456@localhost:5432/chatapp_db"

# 2. Setup Password Hashing (using the passlib you installed)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def seed_data():
    print("Starting database seed...")
    
    # Create the Async Engine and Session
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        try:
            # --- 1. CREATE USERS ---
            print("Creating users...")
            user1 = User(
                username="alice_wonder",
                display_name="Alice",
                email="alice@example.com",
                hashed_password=get_password_hash("password123")
            )
            user2 = User(
                username="bob_builder",
                display_name="Bob",
                email="bob@example.com",
                hashed_password=get_password_hash("password123")
            )
            user3 = User(
                username="charlie_chaplin",
                display_name="Charlie",
                email="charlie@example.com",
                hashed_password=get_password_hash("password123")
            )
            
            session.add_all([user1, user2, user3])
            await session.flush() # Flush to get their auto-generated UUIDs

            # --- 2. CREATE A DIRECT CONVERSATION (Alice & Bob) ---
            print("Creating direct conversation...")
            direct_conv = Conversation(
                type=ConversationType.direct,
                last_message_content="Hey Bob!",
                last_message_sender=user1.id
            )
            session.add(direct_conv)
            await session.flush()

            # Add participants to direct conversation
            session.add_all([
                ConversationParticipant(user_id=user1.id, conversation_id=direct_conv.id),
                ConversationParticipant(user_id=user2.id, conversation_id=direct_conv.id)
            ])

            # Add a message to the direct conversation
            msg1 = Message(
                sender_id=user1.id,
                conversation_id=direct_conv.id,
                content="Hey Bob!"
            )
            session.add(msg1)

            # --- 3. CREATE A GROUP CONVERSATION (Alice, Bob & Charlie) ---
            print("Creating group conversation...")
            group_conv = Conversation(
                type=ConversationType.group,
                group_name="ZOLA Dev Team",
                group_created_by=user1.id,
                last_message_content="Welcome to the team everyone.",
                last_message_sender=user1.id
            )
            session.add(group_conv)
            await session.flush()

            # Add participants to group
            session.add_all([
                ConversationParticipant(user_id=user1.id, conversation_id=group_conv.id),
                ConversationParticipant(user_id=user2.id, conversation_id=group_conv.id),
                ConversationParticipant(user_id=user3.id, conversation_id=group_conv.id)
            ])

            # Add a message to the group
            msg2 = Message(
                sender_id=user1.id,
                conversation_id=group_conv.id,
                content="Welcome to the team everyone."
            )
            session.add(msg2)

            # --- 4. COMMIT TO DATABASE ---
            await session.commit()
            print("Seeding complete! Database is ready.")

        except Exception as e:
            await session.rollback()
            print(f"Error during seeding: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    # Run the async function
    asyncio.run(seed_data())