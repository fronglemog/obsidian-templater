import TemplaterPlugin from "main";
import { Templater } from "core/Templater";
import {
    Menu,
    MenuItem,
    moment,
    normalizePath,
    TAbstractFile,
} from "obsidian";
import { get_active_file } from "utils/Utils";
import { getLocalSettings } from "settings/LocalSettings";

export default class EventHandler {
    constructor(
        private plugin: TemplaterPlugin,
        private templater: Templater,
    ) {}

    async setup(): Promise<void> {
        this.plugin.app.workspace.onLayoutReady(async () => {
            if (getLocalSettings(this.plugin.app).trigger_on_file_creation) {
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
                            await Templater.on_file_creation(
                                this.templater,
                                this.plugin.app,
                                active_file,
                            );
                        }
                    }
                }
            }
            this.plugin.registerEvent(
                this.plugin.app.vault.on("create", (file: TAbstractFile) =>
                    Templater.on_file_creation(
                        this.templater,
                        this.plugin.app,
                        file,
                    ),
                ),
            );
        });
        await this.update_syntax_highlighting();
    }

    async update_syntax_highlighting(): Promise<void> {
        const desktopShouldHighlight =
            this.plugin.editor_handler.desktopShouldHighlight();
        const mobileShouldHighlight =
            this.plugin.editor_handler.mobileShouldHighlight();

        if (desktopShouldHighlight || mobileShouldHighlight) {
            await this.plugin.editor_handler.enable_highlighter();
        } else {
            await this.plugin.editor_handler.disable_highlighter();
        }
    }
}
