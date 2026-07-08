import { Button } from './Button';
import { ColorPicker } from './ColorPicker';
import { MultiToggle } from './Dropdown';
import { Separator } from './Separator';

export const SEPARATOR_HEIGHT = 26;
export const COMPONENT_HEIGHT = 54;
export const BUTTON_ONLY_HEIGHT = 46;

export const getComponentExpansionHeight = (component, useExpandedHeightWhenStatic = false) => {
    if (!(component instanceof MultiToggle || component instanceof ColorPicker) || typeof component.getExpandedHeight !== 'function') {
        return 0;
    }
    if (component.animationProgress !== undefined) {
        return component.getExpandedHeight() * component.animationProgress;
    }
    return useExpandedHeightWhenStatic ? component.getExpandedHeight() : 0;
};

export const getComponentLayoutHeight = (component, useExpandedHeightWhenStatic = false) => {
    if (component instanceof Separator) return SEPARATOR_HEIGHT;
    const baseHeight = component instanceof Button && component.title === component.buttonText ? BUTTON_ONLY_HEIGHT : COMPONENT_HEIGHT;
    return baseHeight + getComponentExpansionHeight(component, useExpandedHeightWhenStatic);
};

export const getComponentXOffset = (component) => (component instanceof Separator ? 0 : 10);

export const getComponentHitRect = (panel, y, height, padding) => ({
    x: panel.x + padding,
    y,
    width: panel.width - 2 * padding,
    height,
});

export const layoutDirectComponents = (components, startY = 0, useExpandedHeightWhenStatic = false) => {
    const rows = [];
    let y = startY;
    let currentSection = null;

    components.forEach((component, index) => {
        if (component.sectionName && component.sectionName !== currentSection) {
            currentSection = component.sectionName;
            if (index > 0) y += 16;
            y += 26;
        }

        const height = getComponentLayoutHeight(component, useExpandedHeightWhenStatic);
        rows.push({ component, y, height });
        y += height;
    });

    return { rows, height: y - startY };
};
