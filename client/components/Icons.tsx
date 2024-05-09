import { AlertCircle, CheckCircle, LucideIcon, XCircle, Check, ChevronDown, ChevronUp, RefreshCcw, Ellipsis, LogOut, Info } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

function interopIcon(icon: LucideIcon) {
    cssInterop(icon, {
        className: {
            target: 'style',
            nativeStyleToProp: {
                color: true,
                opacity: true,
            },
        },
    });
}

const icons: LucideIcon[] = [AlertCircle, CheckCircle, XCircle, Check, ChevronDown, ChevronUp, RefreshCcw, Ellipsis, LogOut, Info]

icons.forEach((icon) => {
    interopIcon(icon)
})

export { AlertCircle, CheckCircle, XCircle, Check, ChevronDown, ChevronUp, RefreshCcw, Ellipsis, LogOut, Info };
