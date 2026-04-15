import TemplaterPlugin from "main";
import { Templater } from "core/Templater";
import { Settings } from "settings/Settings";
import {
    EventRef,
    TAbstractFile,
} from "obsidian";
import { get_active_file } from "utils/Utils";

export default class EventHandler {
    private trigger_on_file_creation_event: EventRef | undefined;

    constructor(
        private plugin: TemplaterPlugin,
        private templater: Templater,
        private settings: Settings,
    ) {}

    setup(): void {
        this.plugin.app.workspace.onLayoutReady(() => {
            if (this.settings.trigger_on_file_creation) {
                const open_behavior =
                    this.plugin.app.vault.getConfig("openBehavior");
                if (open_behavior === "daily") {
                    const daily_notes_plugin =
                        this.plugin.app.internalPlugins.getEnabledPluginById(
                            "daily-notes",
                        );
                    if (daily_notes_plugin) {
                        const { folder, format } = daily_notes_plugin.options;
                        const daily_note_path = normalizePath(
                            `${folder}/${moment().format(format)}.md`,
                        );
                        const active_file = get_active_file(this.plugin.app);
                        if (active_file?.path === daily_note_path) {
                            Templater.on_file_creation(
                                this.templater,
                                this.plugin.app,
                                active_file,
                            );
                        }
                    }
                }
            }
            this.update_trigger_file_on_creation();
        });
        this.update_syntax_highlighting();
    }

    update_syntax_highlighting(): void {
        const desktopShouldHighlight =
            this.plugin.editor_handler.desktopShouldHighlight();
        const mobileShouldHighlight =
            this.plugin.editor_handler.mobileShouldHighlight();

        if (desktopShouldHighlight || mobileShouldHighlight) {
            this.plugin.editor_handler.enable_highlighter();
        } else {
            this.plugin.editor_handler.disable_highlighter();
        }
    }

    update_trigger_file_on_creation(): void {
        if (this.settings.trigger_on_file_creation) {
            this.trigger_on_file_creation_event = this.plugin.app.vault.on(
                "create",
                (file: TAbstractFile) =>
                    Templater.on_file_creation(
                        this.templater,
                        this.plugin.app,
                        file,
                    ),
            );
            this.plugin.registerEvent(this.trigger_on_file_creation_event);
        } else {
            if (this.trigger_on_file_creation_event) {
                this.plugin.app.vault.offref(
                    this.trigger_on_file_creation_event,
                );
                this.trigger_on_file_creation_event = undefined;
            }
        }
    }
}
