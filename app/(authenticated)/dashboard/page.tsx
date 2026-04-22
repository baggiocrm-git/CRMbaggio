'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Lock, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { HUB_MODULES, canAccessPathForRole } from '@/lib/navigation';

const MODULE_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  documentos: { x: 5.8, y: -0.3 },
  contatos: { x: 10.7, y: -1.1 },
  contabil: { x: 14.2, y: -0.2 },
  rh: { x: 14.4, y: 2.8 },
  agenda: { x: -5.8, y: -0.3 },
  financeiro: { x: -12.3, y: -1.2 },
  engenharia: { x: -14.2, y: 2.2 },
  suprimentos: { x: -12.1, y: 2.7 },
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
      }
    };

    syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userRole = typeof user?.user_metadata?.role === 'string' ? user.user_metadata.role : 'Usuário';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const availableModules = HUB_MODULES.filter((module) => canAccessPathForRole(userRole, module.href));
  const highlightedId = hoveredId ?? availableModules[0]?.id ?? null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.replace('/login');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-2 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[#081120]/72 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                Central de Acesso
              </h1>
              <div className="inline-flex w-fit items-center rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-lime-200">
                ERP CBSL
              </div>
            </div>
            <div>
              <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                Escolha um setor para entrar em tela cheia. Itens disponíveis para o seu perfil recebem destaque neon e animação; os bloqueados permanecem desabilitados.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Usuário ativo</p>
              <p className="mt-1 text-sm font-bold text-white">{userName}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">{userRole}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.26em] text-rose-300 transition hover:border-rose-400/40 hover:text-rose-200"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>

        <div className="mt-2">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(115,215,255,0.14),rgba(5,8,22,0.94)_62%)] px-4 py-6 sm:px-6 lg:min-h-[720px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_52%)]" />

            <div className="relative hidden h-[680px] lg:block">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                {HUB_MODULES.map((module) => {
                  const angle = (module.angle * Math.PI) / 180;
                  const x1 = 50 + Math.cos(angle) * 14;
                  const y1 = 50 + Math.sin(angle) * 14;
                  const x2 = 50 + Math.cos(angle) * 29;
                  const y2 = 50 + Math.sin(angle) * 29;
                  const isAvailable = canAccessPathForRole(userRole, module.href);
                  const isHighlighted = highlightedId === module.id && isAvailable;

                  return (
                    <line
                      key={module.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isAvailable ? (isHighlighted ? '#d4ff3f' : '#b7d51f') : '#5b6477'}
                      strokeWidth={isHighlighted ? 0.8 : 0.55}
                      strokeLinecap="round"
                      className={cn(isAvailable && 'transition-all duration-300')}
                      style={isHighlighted ? { filter: 'drop-shadow(0 0 8px rgba(212,255,63,0.85))' } : undefined}
                    />
                  );
                })}
              </svg>

              <div className="absolute left-1/2 top-1/2 flex h-[19rem] w-[19rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/30 bg-[radial-gradient(circle_at_center,rgba(100,200,255,0.28),rgba(8,17,32,0.95)_68%)] shadow-[0_0_90px_rgba(113,203,255,0.2)]">
                <div className="relative h-40 w-40 rounded-full border border-white/15 bg-white/5">
                    <Image
                      src="https://github.com/baggiocrm-git/imagens/blob/main/LOGO%20CBSL_sem%20escrita_Pequeno.png?raw=true"
                      alt="CBSL"
                      fill
                      sizes="160px"
                      className="object-contain p-3 drop-shadow-[0_0_18px_rgba(106,214,255,0.3)]"
                      priority
                      referrerPolicy="no-referrer"
                    />
                </div>
              </div>

              {HUB_MODULES.map((module) => {
                const angle = (module.angle * Math.PI) / 180;
                const radius = 33.5;
                const baseX = 50 + Math.cos(angle) * radius;
                const baseY = 50 + Math.sin(angle) * radius;
                const offset = MODULE_LABEL_OFFSETS[module.id] ?? { x: 0, y: 0 };
                const x = baseX + offset.x;
                const y = baseY + offset.y;
                const isAvailable = canAccessPathForRole(userRole, module.href);
                const isHighlighted = highlightedId === module.id && isAvailable;
                const title = module.shortTitle || module.title;

                const itemContent = (
                  <motion.div
                    animate={isAvailable ? { scale: isHighlighted ? 1.08 : 1 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className={cn(
                      'group flex min-w-[11rem] flex-col items-center gap-0.5 text-center transition-all duration-300',
                      isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-45'
                    )}
                    onMouseEnter={() => {
                      if (isAvailable) setHoveredId(module.id);
                    }}
                    onMouseLeave={() => {
                      if (isAvailable) setHoveredId(null);
                    }}
                  >
                    <span
                      className={cn(
                        'font-black uppercase tracking-[0.14em] transition-all duration-300',
                        isAvailable ? 'text-[#d4ff3f]' : 'text-slate-500'
                      )}
                      style={isHighlighted ? { textShadow: '0 0 16px rgba(212,255,63,0.9)' } : undefined}
                    >
                      {title}
                    </span>
                    <span className="max-w-[11rem] px-0.5 text-[10px] leading-[1.25] text-slate-500">
                      {module.description}
                    </span>
                  </motion.div>
                );

                return (
                  <div
                    key={module.id}
                    className="absolute"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {isAvailable ? (
                      <Link href={module.href} className="block">
                        {itemContent}
                      </Link>
                    ) : (
                      <div aria-disabled="true">{itemContent}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative space-y-4 lg:hidden">
              {HUB_MODULES.map((module) => {
                const isAvailable = canAccessPathForRole(userRole, module.href);
                const isHighlighted = highlightedId === module.id && isAvailable;

                const mobileCard = (
                  <motion.div
                    animate={isAvailable ? { scale: isHighlighted ? 1.02 : 1 } : { scale: 1 }}
                    whileHover={isAvailable ? { scale: 1.02 } : undefined}
                    onHoverStart={() => {
                      if (isAvailable) setHoveredId(module.id);
                    }}
                    onHoverEnd={() => {
                      if (isAvailable) setHoveredId(null);
                    }}
                    className={cn(
                      'rounded-[26px] border px-4 py-4 transition-all',
                      isAvailable
                        ? 'border-lime-300/20 bg-lime-300/10 text-white shadow-[0_0_30px_rgba(212,255,63,0.08)]'
                        : 'border-white/10 bg-white/[0.03] text-slate-500 opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p
                          className={cn(
                            'text-lg font-black uppercase tracking-[0.12em]',
                            isAvailable ? 'text-[#d4ff3f]' : 'text-slate-500'
                          )}
                        >
                          {module.title}
                        </p>
                          <p className="mt-0.5 px-0.5 text-xs leading-[1.25] text-slate-400">{module.description}</p>
                      </div>
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full border',
                          isAvailable
                            ? 'border-lime-300/20 bg-lime-300/10 text-[#d4ff3f]'
                            : 'border-white/10 bg-white/[0.03] text-slate-500'
                        )}
                      >
                        {isAvailable ? <ArrowRight size={18} /> : <Lock size={18} />}
                      </div>
                    </div>
                  </motion.div>
                );

                return (
                  isAvailable ? (
                    <Link key={module.id} href={module.href} className="block">
                      {mobileCard}
                    </Link>
                  ) : (
                    <div key={module.id} className="block pointer-events-none">
                      {mobileCard}
                    </div>
                  )
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
