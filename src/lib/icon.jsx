import {
  Zap, Bot, BarChart2, BarChart3, Shield, Sword, Gauge, Target, Trophy, Crown,
  Terminal, Cpu, Server, Globe, Coins, Sparkles, Repeat, Database, Lock, Power,
  LogIn, LogOut, Wallet, Search, Grid3X3, Home, SlidersHorizontal, Moon, Sun,
  List, Menu, X, ArrowLeft, ArrowRight, Check, Clock, Folder, Image, Loader,
  MessageCircle, StickyNote, PlusSquare, ListChecks, FileText, Plus, ThumbsUp,
  ThumbsDown, ExternalLink, Calendar, CalendarCheck, Newspaper, ChevronLeft,
  ChevronRight, ChevronsUpDown, MoreVertical, User, Bell, Settings, Briefcase,
  Clipboard, Upload, Crosshair, Mail, Pencil, Archive, AlertTriangle,
  LayoutDashboard, Square, Circle, Users, BellDot, Mic, Copy, ArrowUp,
  ArrowDown, AlignLeft, AlignCenter, AlignRight, Shrimp, Paperclip,
  SendHorizontal, Minus, Volume2, VolumeOff, Play, Pause, SkipForward,
  RotateCcw, Maximize, ChevronDown, ChevronUp, Share2, Heart,
} from 'lucide-react'

const icons = {
  zap: Zap, robot: Bot, chart: BarChart2, 'chart-bar': BarChart3,
  shield: Shield, sword: Sword, speed: Gauge, target: Target, trophy: Trophy,
  crown: Crown, terminal: Terminal, cpu: Cpu, server: Server, globe: Globe,
  coins: Coins, coin: Coins, sparkle: Sparkles, repeat: Repeat,
  database: Database, lock: Lock, power: Power, login: LogIn, logout: LogOut,
  wallet: Wallet, search: Search, grid: Grid3X3, home: Home,
  sliders: SlidersHorizontal, 'sliders-2': SlidersHorizontal, moon: Moon,
  sun: Sun, list: List, bulletlist: List, menu: Menu, close: X,
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, check: Check,
  clock: Clock, folder: Folder, image: Image, loader: Loader,
  message: MessageCircle, note: StickyNote, 'add-box': PlusSquare,
  'list-box': ListChecks, 'file-text': FileText, plus: Plus, minus: Minus,
  volume: Volume2, 'volume-off': VolumeOff, 'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown, 'external-link': ExternalLink,
  calendar: Calendar, 'calendar-check': CalendarCheck, article: Newspaper,
  'edit-box': Newspaper, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight, 'chevron-down': ChevronDown,
  'chevron-up': ChevronUp, 'chevrons-vertical': ChevronsUpDown,
  'more-vertical': MoreVertical, notification: Bell, settings: Settings,
  briefcase: Briefcase, clipboard: Clipboard, user: User, upload: Upload,
  'bullseye-arrow': Crosshair, mail: Mail, edit: Pencil, archive: Archive,
  alert: AlertTriangle, dashboard: LayoutDashboard, open: ExternalLink,
  square: Square, circle: Circle, users: Users, 'bell-dot': BellDot,
  mic: Mic, copy: Copy, 'arrow-up': ArrowUp, 'arrow-down': ArrowDown,
  'align-left': AlignLeft, 'align-center': AlignCenter,
  'align-right': AlignRight, shrimp: Shrimp, paperclip: Paperclip,
  send: SendHorizontal, share: Share2, heart: Heart, play: Play, pause: Pause,
  'skip-forward': SkipForward, 'rotate-ccw': RotateCcw, maximize: Maximize,
}

const sizeClasses = {
  12: 'w-3 h-3', 14: 'w-3.5 h-3.5', 16: 'w-4 h-4',
  18: 'w-[18px] h-[18px]', 20: 'w-5 h-5', 24: 'w-6 h-6',
}

export default function Icon({ name, size = 24, className = '', style, color, ...rest }) {
  const IconComponent = icons[name] || icons.zap
  const sizeClass = sizeClasses[size] || `w-[${size}px] h-[${size}px]`
  return (
    <IconComponent
      className={`${sizeClass} ${className}`}
      aria-hidden="true"
      style={{ ...(color ? { color } : {}), ...style }}
      strokeWidth={2}
      {...rest}
    />
  )
}
