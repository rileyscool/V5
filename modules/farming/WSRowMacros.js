import { WSRowMacro } from './WSRowMacro';

[
    [
        {
            name: 'A/D Cactus Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ad cactus',
        -68.19,
        -17.4,
        true,
    ],
    [
        {
            name: 'A/D Cocoa Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ad cocoa',
        -166.4,
        -79,
        true,
    ],
    [
        {
            name: 'W/S Crop Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ws crop',
        -26.6,
    ],
    [
        {
            name: 'W/S Flower Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ws flower',
        -106.88,
    ],
    [
        {
            name: 'W/S Melon Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ws melon',
        -119.99,
        25,
    ],
    [
        {
            name: 'W/S Mushroom Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ws mushroom',
        -116.57,
    ],
    [
        {
            name: 'W/S Sugar Cane Macro',
            description: 'Designed for 16thGarden megafarm.',
            tooltip: '/visit 16thGarden for design.',
        },
        'farming ws cane',
        -123.61,
    ],
    [
        {
            name: 'Vertical Crop Macro',
            description: 'Designed for taunahi megafarm.',
            tooltip: 'Basic Vertical S-Shape Crop Macro.',
        },
        'farming ad vertical',
        0,
        0,
        true,
    ],
].forEach((args) => new WSRowMacro(...args));
