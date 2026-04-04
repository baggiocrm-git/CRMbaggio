'use client'

import React from 'react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
      <div className="text-center flex flex-col items-center">
        {/* Logo Section */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center justify-center">
          <span>CBSL</span>
          <span className="text-[#d4ff3f] ml-1">ERP</span>
        </h1>
        
        <p className="text-[#60728a] font-bold tracking-[0.15em] text-[10px] md:text-xs uppercase mt-3 mb-8">
          SISTEMA DE GESTÃO DE ENGENHARIA
        </p>

        {/* Action Button */}
        <Link 
          href="/login" 
          className="inline-block bg-[#d4ff3f] text-black font-bold px-8 py-3 rounded-xl text-xs md:text-sm uppercase tracking-wider hover:bg-[#c4ef2f] transition-colors"
        >
          ENTRAR NO SISTEMA
        </Link>
      </div>
    </div>
  )
}
