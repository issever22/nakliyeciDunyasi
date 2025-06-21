
'use server';
import { db } from '@/lib/firebase';
import type { Message } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  doc,
  updateDoc
} from 'firebase/firestore';

const MESSAGES_COLLECTION = 'messages';

const convertToMessage = (docData: DocumentData, id: string): Message => {
  const data = { ...docData };
  let createdAtStr: string;
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    createdAtStr = data.createdAt.toDate().toISOString();
  } else {
    createdAtStr = new Date().toISOString();
  }

  return {
    id,
    userId: data.userId || '',
    userName: data.userName || 'Bilinmeyen Kullanıcı',
    title: data.title || '',
    content: data.content || '',
    createdAt: createdAtStr,
    isRead: data.isRead || false,
  };
};

export const getAllMessages = async (): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertToMessage(doc.data(), doc.id));
  } catch (error) {
    console.error(`Error fetching all messages: `, error);
    return [];
  }
};

export const addMessage = async (data: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Promise<string | null> => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const docRef = await addDoc(messagesRef, {
      ...data,
      isRead: false,
      createdAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding message: `, error);
    return null;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      isRead: true,
    });
    return true;
  } catch (error) {
    console.error(`Error marking message as read: `, error);
    return false;
  }
};
