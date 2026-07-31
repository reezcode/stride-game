import { 
  IconMask, IconWand, IconReceiptOff, IconLockOpen, IconBan, IconCrown,
  IconFolder, IconPlug, IconSearch, IconLock,
  IconCode, IconBrush, IconShieldCheck,
  IconChartBar, IconDeviceDesktop, IconSignature, IconClock,
  IconKey, IconUpload, IconDoor, IconSettings,
  IconBolt, IconLockAccess, IconBug,
  IconBugOff, IconUserOff,
  IconAlertTriangle, IconLockSquare, IconRefresh, IconDownload,
  IconEye, IconNote, IconFlame, IconBrain, IconCheck,
  IconX, IconFileText
} from '@tabler/icons-vue'

export const strideIcons: Record<string, any> = {
  S: IconMask,
  T: IconWand,
  R: IconReceiptOff,
  I: IconLockOpen,
  D: IconBan,
  E: IconCrown
}

// Keys are now semantic string labels (not emojis)
export const failPointIcons: Record<string, any> = {
  'folder':       IconFolder,
  'plug':         IconPlug,
  'search':       IconSearch,
  'lock':         IconLock,
  'code':         IconCode,
  'brush':        IconBrush,
  'shield-check': IconShieldCheck,
  'chart-bar':    IconChartBar,
  'monitor':      IconDeviceDesktop,
  'signature':    IconSignature,
  'clock':        IconClock,
  'key':          IconKey,
  'upload':       IconUpload,
  'door':         IconDoor,
  'settings':     IconSettings,
  'bolt':         IconBolt,
  'lock-access':  IconLockAccess,
  'bug':          IconBug,
  'bug-off':      IconBugOff,
  'user-off':     IconUserOff,
}

// Utility icons for UI components (re-exported for convenient import from @/icons)
export {
  IconAlertTriangle,
  IconLockSquare as IconLocked,
  IconRefresh,
  IconDownload,
  IconEye,
  IconNote,
  IconFlame,
  IconBrain,
  IconCheck,
  IconX,
  IconBolt as IconZap,
  IconFileText,
  IconChartBar,
  IconKey,
}
