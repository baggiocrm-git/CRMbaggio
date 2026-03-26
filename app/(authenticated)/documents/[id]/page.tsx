'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Save, Share2, MoreHorizontal, FileText, Clock, User } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { db, auth, doc, getDoc, updateDoc, onSnapshot, serverTimestamp, OperationType, handleFirestoreError } from '../../../lib/firebase'
import { useAuth } from '../../../lib/FirebaseProvider'

export default function DocumentEditorPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('Loading...')
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('Never')
  const [authorName, setAuthorName] = useState('')
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading || !params.id) return

    const docRef = doc(db, 'documents', params.id)
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setTitle(data.title)
        setContent(data.content)
        setAuthorName(data.authorName)
        setLastSaved(data.updatedAt?.toDate()?.toLocaleTimeString() || 'Just now')
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `documents/${params.id}`)
    })

    return () => unsubscribe()
  }, [params.id, authLoading])

  const handleSave = async () => {
    if (!user || !params.id) return
    setIsSaving(true)
    try {
      const docRef = doc(db, 'documents', params.id)
      await updateDoc(docRef, {
        title,
        content,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `documents/${params.id}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] flex flex-col">
      {/* Editor Header */}
      <header className="border-b border-[#0a0a0a]/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/documents" className="p-2 hover:bg-[#0a0a0a]/5 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-bold tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-64"
              />
              <div className="flex items-center gap-4 text-xs text-[#0a0a0a]/40">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last saved {lastSaved}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {authorName}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPreview(!isPreview)}
              className="px-4 py-2 text-sm font-medium hover:bg-[#0a0a0a]/5 rounded-full transition-colors"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#0a0a0a] text-[#f5f5f4] px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="p-2 hover:bg-[#0a0a0a]/5 rounded-full transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-[#0a0a0a]/5 rounded-full transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-12">
        <div className="bg-white border border-[#0a0a0a]/10 rounded-3xl min-h-[70vh] shadow-xl shadow-[#0a0a0a]/5 p-12">
          {isPreview ? (
            <div className="prose prose-stone max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your document..."
              className="w-full h-full min-h-[60vh] text-lg font-serif leading-relaxed bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
            />
          )}
        </div>
      </main>
    </div>
  )
}
