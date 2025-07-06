import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

class ChatService {
  // Create or get existing chat between two users
  async getOrCreateChat(user1Id, user2Id) {
    try {
      // Check if chat already exists
      const existingChat = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        [
          Query.or([
            Query.and([
              Query.equal('user1Id', user1Id),
              Query.equal('user2Id', user2Id)
            ]),
            Query.and([
              Query.equal('user1Id', user2Id),
              Query.equal('user2Id', user1Id)
            ])
          ])
        ]
      );

      if (existingChat.documents.length > 0) {
        return existingChat.documents[0];
      }

      // Create new chat
      const newChat = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        ID.unique(),
        {
          user1Id,
          user2Id,
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      );

      return newChat;
    } catch (error) {
      console.error('Error getting or creating chat:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(chatId, senderId, content, messageType = 'text') {
    try {
      const message = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          chatId,
          senderId,
          content,
          messageType,
          createdAt: new Date().toISOString(),
          isRead: false
        }
      );

      // Update chat's last message time
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        chatId,
        {
          lastMessageAt: new Date().toISOString(),
          lastMessage: content.substring(0, 100) // Store preview
        }
      );

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a chat
  async getMessages(chatId, limit = 50, offset = 0) {
    try {
      const messages = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('chatId', chatId),
          Query.orderDesc('createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return messages.documents.reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // Get user's chats
  async getUserChats(userId) {
    try {
      const chats = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        [
          Query.or([
            Query.equal('user1Id', userId),
            Query.equal('user2Id', userId)
          ]),
          Query.orderDesc('lastMessageAt')
        ]
      );

      // Get other user details for each chat
      const chatsWithUsers = await Promise.all(
        chats.documents.map(async (chat) => {
          const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
          try {
            const otherUser = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              otherUserId
            );
            return {
              ...chat,
              otherUser
            };
          } catch (error) {
            console.error('Error getting other user details:', error);
            return chat;
          }
        })
      );

      return chatsWithUsers;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId, userId) {
    try {
      const unreadMessages = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('chatId', chatId),
          Query.equal('isRead', false),
          Query.notEqual('senderId', userId)
        ]
      );

      // Update all unread messages
      await Promise.all(
        unreadMessages.documents.map(message =>
          databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.MESSAGES,
            message.$id,
            { isRead: true }
          )
        )
      );

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount(userId) {
    try {
      // Get all chats for user
      const chats = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        [
          Query.or([
            Query.equal('user1Id', userId),
            Query.equal('user2Id', userId)
          ])
        ]
      );

      let totalUnread = 0;
      for (const chat of chats.documents) {
        const unreadMessages = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          [
            Query.equal('chatId', chat.$id),
            Query.equal('isRead', false),
            Query.notEqual('senderId', userId)
          ]
        );
        totalUnread += unreadMessages.documents.length;
      }

      return totalUnread;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Delete chat and all its messages
  async deleteChat(chatId, userId) {
    try {
      const chat = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        chatId
      );

      // Check if user is part of this chat
      if (chat.user1Id !== userId && chat.user2Id !== userId) {
        throw new Error('Permission denied');
      }

      // Delete all messages in this chat
      const messages = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [Query.equal('chatId', chatId)]
      );

      // Delete messages in batches
      for (const message of messages.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          message.$id
        );
      }

      // Delete the chat itself
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.CHATS,
        chatId
      );

      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Delete individual message
  async deleteMessage(messageId, userId) {
    try {
      const message = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );

      // Check if user is the sender
      if (message.senderId !== userId) {
        throw new Error('Permission denied - You can only delete your own messages');
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Edit message
  async editMessage(messageId, userId, newContent) {
    try {
      const message = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );

      // Check if user is the sender
      if (message.senderId !== userId) {
        throw new Error('Permission denied - You can only edit your own messages');
      }

      // Check if message is within edit time limit (5 minutes)
      const messageTime = new Date(message.createdAt);
      const now = new Date();
      const diffMinutes = (now - messageTime) / (1000 * 60);
      
      if (diffMinutes > 5) {
        throw new Error('Message can only be edited within 5 minutes of sending');
      }

      const updatedMessage = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        {
          content: newContent,
          isEdited: true,
          editedAt: new Date().toISOString()
        }
      );

      return updatedMessage;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
