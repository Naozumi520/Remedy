const { app } = require('electron'),
    path = require('path'),
    ElectronPreferences = require('electron-preferences'),
    appPath = app.getAppPath()

const defaultSettings = {
    Interface: {
        general: [],
        txt_color: '#ffffff',
        txt_outline_color: '#000000',
        txt_shadow_color: '#000000',
        txt_size: '14',
        txt_outline_size: '0',
        txt_shadow_size: '0',
        bg_color: '#1e2124',
        bg_shadow_color: '#000000',
        bg_shadow_size: '0',
        bg_opacity: '95'
    }
}

const preferences = new ElectronPreferences({
    dataStore: path.resolve(app.getPath('userData'), 'config.json'),
    debug: true,
    defaults: defaultSettings,
    browserWindowOverrides: {
        title: `Preferences | ${app.name}`,
        icon: path.join(appPath, '/src/icon/favicon.png'),
        resizable: false,
        maximizable: false,
    },
    sections: [
        {
            id: 'Interface',
            label: 'Interface',
            icon: 'eye-19',
            form: {
                groups: [
                    {
                        fields: [
                            {
                                label: 'GENERAL',
                                key: 'general',
                                type: 'checkbox',
                                options: [
                                    {
                                        label: 'Show Speaking Users Only',
                                        value: 'users_only',
                                    },
                                    {
                                        label: 'Small Avatars',
                                        value: 'small_avt',
                                    },
                                    {
                                        label: 'Hide Names',
                                        value: 'hide_nick',
                                    }
                                ]
                            },
                            {
                                label: 'TEXT COLOR',
                                key: 'txt_color',
                                type: 'color',
                                format: 'hex',
                                options: [
                                    { label: 'Text Color' }
                                ]
                            },
                            {
                                label: 'TEXT OUTLINE COLOR',
                                key: 'txt_outline_color',
                                type: 'color',
                                format: 'hex',
                                options: [
                                    { label: 'Text Outline Color' }
                                ]
                            },
                            {
                                label: 'TEXT SHADOW COLOR',
                                key: 'txt_shadow_color',
                                type: 'color',
                                format: 'hex',
                                options: [
                                    { label: 'Text Shadow Color' }
                                ]
                            },
                            {
                                label: 'TEXT Size',
                                key: 'txt_size',
                                type: 'text',
                                format: 'hex',
                                options: [
                                    { label: 'Text Size' }
                                ]
                            },
                            {
                                label: 'TEXT OUTLINE Size',
                                key: 'txt_outline_size',
                                type: 'text',
                                format: 'hex',
                                options: [
                                    { label: 'Text Outline Size' }
                                ]
                            },
                            {
                                label: 'TEXT SHADOW Size',
                                key: 'txt_shadow_size',
                                type: 'text',
                                format: 'hex',
                                options: [
                                    { label: 'Text Shadow Size' }
                                ]
                            },
                            {
                                label: 'BACKGROUND COLOR',
                                key: 'bg_color',
                                type: 'color',
                                format: 'hex',
                                options: [
                                    { label: 'Background Color' }
                                ]
                            },
                            {
                                label: 'BACKGROUND SHADOW COLOR',
                                key: 'bg_shadow_color',
                                type: 'color',
                                format: 'hex',
                                options: [
                                    { label: 'Background Shadow Color' }
                                ]
                            },
                            {
                                label: 'BACKGROUND SHADOW SIZE',
                                key: 'bg_shadow_size',
                                type: 'text',
                                format: 'hex',
                                options: [
                                    { label: 'Background Shadow Size' }
                                ]
                            },
                            {
                                label: 'Reset',
                                key: 'reset_pref',
                                type: 'button',
                                buttonLabel: 'Reset preferences',
                                help: 'Resetting the preferences to default.',
                                hideLabel: false
                            },
                            {
                                key: 'reset_whole_app',
                                type: 'button',
                                buttonLabel: 'Reset! The! Whole! App!',
                                help: 'Resetting the entire application will roll the program back to its default state.'
                            }
                        ]
                    }
                ]
            }
        }
    ]
});

preferences.on('click', key => {
    if (key === 'reset_pref') {
        const defaults = defaultSettings
        for (const [key, value] of Object.entries(defaults)) {
            preferences.value(key, value)
        }
        setTimeout(() => {
            app.relaunch();
            app.exit();
        }, 5000);
    }
    if (key === 'reset_whole_app') {
        const fs = require('fs');
        fs.rm(app.getPath('userData'), { recursive: true, force: true }, () => {
            app.relaunch();
            app.exit();
        });
    }
})

module.exports = { preferences };