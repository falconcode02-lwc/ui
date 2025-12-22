export interface EditorAction {
    /** Unique identifier for the action (used internally) */
    id: string;

    /** Display name for the button */
    label: string;

    /** Optional icon name (from nz-icon) */
    icon?: string;

    /** Tooltip text for hover help */
    tooltip?: string;

    /** Type or category (e.g., canvas, node, flow, etc.) */
    category?: 'canvas' | 'node' | 'workflow' | 'system';

    /** Whether the button is currently enabled */
    enabled?: boolean;

    /** Optional style or appearance */
    style?: 'primary' | 'default' | 'danger' | 'link' | 'dashed';

    /** Action callback or event name to trigger */
    action?: () => void;

    /** Whether it should be visible in toolbar */
    visible?: boolean;

    /** Optional keyboard shortcut (for power users) */
    shortcut?: string;
}