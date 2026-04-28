'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Landmark,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import {
  HUB_MODULES,
  canAccessPathForRole,
  getFinanceEntryPathForRole,
  getRoleFromUser,
  isAdminRole,
} from '@/lib/navigation';

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

const ADMIN_FINANCE_BRANCHES = [
  {
    title: 'Dashboard',
    href: '/finances',
    icon: LayoutDashboard,
  },
  {
    title: 'Contas a Receber',
    href: '/finances/receivables',
    icon: TrendingUp,
  },
  {
    title: 'Contas a Pagar',
    href: '/finances/payables',
    icon: TrendingDown,
  },
  {
    title: 'Conexoes Bancarias',
    href: '/finances/banking',
    icon: Landmark,
  },
  {
    title: 'Centros de Custo',
    href: '/finances/cost-centers',
    icon: Layers,
  },
  {
    title: 'Notas Fiscais',
    href: '/finances/invoices',
    icon: ReceiptText,
  },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [financeBranchOpen, setFinanceBranchOpen] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastHoveredIdRef = useRef<string | null>(null);
  const financeBranchCloseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setUser(session?.user ?? null);
        setAuthResolved(true);
      }
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setAuthResolved(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (typeof window === 'undefined') return;

      const AudioContextClass = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        void audioContext.resume();
      }

      setAudioUnlocked(true);
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const userRole = getRoleFromUser(user);
  const isAdmin = isAdminRole(userRole);
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuario';

  const getModuleHref = (moduleId: string) => {
    if (!authResolved) return '#';

    if (moduleId !== 'financeiro') {
      return HUB_MODULES.find((module) => module.id === moduleId)?.href || '/dashboard';
    }

    return getFinanceEntryPathForRole(userRole);
  };

  const availableModules = authResolved
    ? HUB_MODULES.filter((module) => canAccessPathForRole(userRole, getModuleHref(module.id)))
    : [];
  const financeModule = HUB_MODULES.find((module) => module.id === 'financeiro');
  const financeAngle = financeModule ? (financeModule.angle * Math.PI) / 180 : 0;
  const financeOffset = MODULE_LABEL_OFFSETS.financeiro ?? { x: 0, y: 0 };
  const financeAnchor = financeModule
    ? {
        x: 50 + Math.cos(financeAngle) * 33.5 + financeOffset.x,
        y: 50 + Math.sin(financeAngle) * 33.5 + financeOffset.y,
      }
    : { x: 50, y: 50 };
  const showFinanceBranches = isAdmin && (financeBranchOpen || hoveredId === 'financeiro');
  const highlightedId = showFinanceBranches ? 'financeiro' : hoveredId ?? availableModules[0]?.id ?? null;
  const financeBranchItems = ADMIN_FINANCE_BRANCHES.filter((item) =>
    canAccessPathForRole(userRole, item.href)
  );

  const clearFinanceBranchCloseTimer = () => {
    if (financeBranchCloseTimeoutRef.current) {
      window.clearTimeout(financeBranchCloseTimeoutRef.current);
      financeBranchCloseTimeoutRef.current = null;
    }
  };

  const openFinanceBranch = () => {
    clearFinanceBranchCloseTimer();
    setFinanceBranchOpen(true);
    setHoveredId('financeiro');
  };

  const scheduleFinanceBranchClose = () => {
    clearFinanceBranchCloseTimer();
    financeBranchCloseTimeoutRef.current = window.setTimeout(() => {
      setFinanceBranchOpen(false);
      setHoveredId(null);
      lastHoveredIdRef.current = null;
    }, 220);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.replace('/login');
    }
  };

  const getOrCreateAudioContext = () => {
    if (typeof window === 'undefined') return null;

    const AudioContextClass = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

    if (!AudioContextClass) return null;

    const audioContext = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = audioContext;

    return audioContext;
  };

  const playHoverSound = (force = false) => {
    if (typeof window === 'undefined' || (!audioUnlocked && !force)) return;

    const audioContext = getOrCreateAudioContext();
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(820, now);
    oscillator.frequency.exponentialRampToValueAtTime(640, now + 0.045);

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(1200, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.032, now + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.065);
  };

  const handleModuleNavigation = (href: string, isAvailable: boolean) => {
    if (!isAvailable || href === '#') return;

    if (typeof window === 'undefined') {
      router.push(href);
      return;
    }

    const audioContext = getOrCreateAudioContext();

    if (audioContext?.state === 'suspended') {
      void audioContext.resume();
    }

    setAudioUnlocked(true);
    playHoverSound(true);

    window.setTimeout(() => {
      router.push(href);
    }, 95);
  };

  const handleModuleHover = (moduleId: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    if (moduleId === 'financeiro' && isAdmin) {
      openFinanceBranch();
    } else {
      clearFinanceBranchCloseTimer();
      setFinanceBranchOpen(false);
      setHoveredId(moduleId);
    }

    if (lastHoveredIdRef.current !== moduleId) {
      lastHoveredIdRef.current = moduleId;
      playHoverSound();
    }
  };

  const handleModuleLeave = (isAvailable: boolean) => {
    if (!isAvailable) return;

    if (hoveredId === 'financeiro' && isAdmin) {
      scheduleFinanceBranchClose();
      return;
    }

    setHoveredId(null);
    setFinanceBranchOpen(false);
    lastHoveredIdRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearFinanceBranchCloseTimer();
    };
  }, []);

  return (
    <div className="dashboard-radial-theme relative flex min-h-screen flex-col overflow-hidden px-4 py-2 sm:px-6 lg:px-10">
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
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-1.5">
              <p className="ui-condensed text-[10px] font-black uppercase tracking-normal leading-none text-lime-300">
                USUARIO ATIVO
              </p>
              <div className="mt-0 flex flex-col gap-0">
                <p className="text-sm font-bold leading-none text-white">{userName}</p>
                <p className="ui-condensed mt-0 text-[10px] font-black uppercase tracking-normal leading-none text-slate-500">
                  {userRole || 'Carregando perfil'}
                </p>
              </div>
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
                  const isAvailable =
                    authResolved && canAccessPathForRole(userRole, getModuleHref(module.id));
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
                      style={
                        isHighlighted
                          ? { filter: 'drop-shadow(0 0 8px rgba(212,255,63,0.85))' }
                          : undefined
                      }
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

              {showFinanceBranches ? (
                <div
                  className="absolute z-20"
                  style={{
                    left: `calc(${financeAnchor.x}% + 6.8rem)`,
                    top: `${financeAnchor.y}%`,
                    transform: 'translateY(-50%)',
                  }}
                  onMouseEnter={openFinanceBranch}
                  onMouseLeave={scheduleFinanceBranchClose}
                >
                  <div className="absolute left-[-109px] top-1/2 h-[2px] w-[110px] -translate-y-1/2 bg-gradient-to-r from-[#d4ff3f] to-cyan-300 shadow-[0_0_14px_rgba(170,240,255,0.55)]" />
                  <div className="absolute left-[-12px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-cyan-200/60 bg-[#d4ff3f] shadow-[0_0_12px_rgba(212,255,63,0.8)]" />
                  <div className="flex w-[15.75rem] flex-col gap-2 rounded-[28px] border border-cyan-200/20 bg-[#06101f]/90 p-3 shadow-[0_0_36px_rgba(103,200,255,0.18)] backdrop-blur-xl">
                    <div className="px-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                        Ramificacao Financeira
                      </p>
                      <p className="mt-1 text-[11px] leading-tight text-slate-400">
                        Acessos diretos do modulo para administradores.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {financeBranchItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex min-h-[4.3rem] flex-col justify-between rounded-[18px] border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-left transition hover:border-cyan-200/35 hover:bg-cyan-300/[0.11]"
                            onPointerDown={(event) => {
                              event.preventDefault();
                              handleModuleNavigation(item.href, true);
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                            }}
                          >
                            <Icon size={15} className="text-cyan-200" />
                            <span className="text-[11px] font-bold leading-tight text-white">
                              {item.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {HUB_MODULES.map((module) => {
                const angle = (module.angle * Math.PI) / 180;
                const radius = 33.5;
                const baseX = 50 + Math.cos(angle) * radius;
                const baseY = 50 + Math.sin(angle) * radius;
                const offset = MODULE_LABEL_OFFSETS[module.id] ?? { x: 0, y: 0 };
                const x = baseX + offset.x;
                const y = baseY + offset.y;
                const moduleHref = getModuleHref(module.id);
                const isAvailable = authResolved && canAccessPathForRole(userRole, moduleHref);
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
                    onMouseEnter={() => handleModuleHover(module.id, isAvailable)}
                    onMouseLeave={() => handleModuleLeave(isAvailable)}
                  >
                    <span
                      className={cn(
                        'font-black uppercase tracking-[0.14em] transition-all duration-300',
                        isAvailable ? 'text-[#d4ff3f]' : 'text-slate-500'
                      )}
                      style={
                        isHighlighted
                          ? { textShadow: '0 0 16px rgba(212,255,63,0.9)' }
                          : undefined
                      }
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
                      <Link
                        href={moduleHref}
                        className="block"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          handleModuleNavigation(moduleHref, isAvailable);
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                        }}
                      >
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
                const moduleHref = getModuleHref(module.id);
                const isAvailable = authResolved && canAccessPathForRole(userRole, moduleHref);
                const isHighlighted = highlightedId === module.id && isAvailable;
                const showMobileFinanceBranch =
                  isAdmin && module.id === 'financeiro' && isAvailable;

                const mobileCard = (
                  <motion.div
                    animate={isAvailable ? { scale: isHighlighted ? 1.02 : 1 } : { scale: 1 }}
                    whileHover={isAvailable ? { scale: 1.02 } : undefined}
                    onHoverStart={() => handleModuleHover(module.id, isAvailable)}
                    onHoverEnd={() => handleModuleLeave(isAvailable)}
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
                        <p className="mt-0.5 px-0.5 text-xs leading-[1.25] text-slate-400">
                          {module.description}
                        </p>
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
                    {showMobileFinanceBranch ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-lime-300/10 pt-3">
                        {financeBranchItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-2 rounded-[16px] border border-cyan-300/15 bg-[#081120]/55 px-3 py-2 text-[11px] font-bold text-cyan-100 transition hover:border-cyan-200/30 hover:bg-cyan-300/10"
                              onPointerDown={(event) => {
                                event.preventDefault();
                                handleModuleNavigation(item.href, true);
                              }}
                              onClick={(event) => {
                                event.preventDefault();
                              }}
                            >
                              <Icon size={14} className="shrink-0 text-cyan-200" />
                              <span className="leading-tight">{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </motion.div>
                );

                return isAvailable && !showMobileFinanceBranch ? (
                  <Link
                    key={module.id}
                    href={moduleHref}
                    className="block"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      handleModuleNavigation(moduleHref, isAvailable);
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                    }}
                  >
                    {mobileCard}
                  </Link>
                ) : isAvailable ? (
                  <div key={module.id} className="block">
                    {mobileCard}
                  </div>
                ) : (
                  <div key={module.id} className="block pointer-events-none">
                    {mobileCard}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
