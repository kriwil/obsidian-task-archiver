import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { SectionParser } from "../parser/SectionParser";
import { Section } from "../model/Section";
import { Block } from "../model/Block";
import { TFile, Vault, Workspace } from "obsidian";
import { DateTreeResolver } from "./DateTreeResolver";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { buildIndentation } from "../util";
import { ListBlock } from "../model/ListBlock";

export class Archiver {
    private readonly archiveHeadingPattern: RegExp;

    constructor(
        private readonly vault: Vault,
        private readonly workspace: Workspace,
        private readonly parser: SectionParser,
        private readonly dateTreeResolver: DateTreeResolver,
        private readonly settings: ArchiverSettings
    ) {
        this.archiveHeadingPattern = Archiver.buildArchiveHeadingPattern(
            settings.archiveHeading
        );
    }

    private static buildArchiveHeadingPattern(archiveHeading: string) {
        const escapedArchiveHeading = escapeStringRegexp(archiveHeading);
        return new RegExp(`^#{1,6}\\s+${escapedArchiveHeading}`);
    }

    private static addNewlinesToSectionIfNeeded(section: Section) {
        let lastSection = section;
        const childrenLength = section.children.length;
        if (childrenLength > 0) {
            lastSection = section.children[childrenLength - 1];
        }
        const blocksLength = lastSection.blockContent.children.length;
        if (blocksLength > 0) {
            const lastBlock = lastSection.blockContent.children[blocksLength - 1];
            if (lastBlock.text.trim().length !== 0) {
                lastSection.blockContent.appendChild(new TextBlock(""));
            }
        }
    }

    async archiveTasksInActiveFile() {
        const activeFile = this.workspace.getActiveFile();
        const activeFileTree = await this.parseFile(activeFile);
        const newlyCompletedTasks = this.extractNewlyCompletedTasks(activeFileTree);

        if (newlyCompletedTasks.length === 0) {
            return "No tasks to archive";
        }

        if (this.settings.archiveToSeparateFile) {
            const archiveFile = await this.getArchiveFileFor(activeFile);
            const archiveTree = await this.parseFile(archiveFile);

            this.archiveToRoot(newlyCompletedTasks, archiveTree);
            await this.writeTreeToFile(archiveFile, archiveTree);
        } else {
            this.archiveToRoot(newlyCompletedTasks, activeFileTree);
        }

        await this.writeTreeToFile(activeFile, activeFileTree);
        return `Archived ${newlyCompletedTasks.length} tasks`;
    }

    private archiveToRoot(newlyCompletedTasks: Block[], root: Section) {
        const archiveSection = this.getArchiveSectionFromRoot(root);
        this.dateTreeResolver.mergeNewBlocksWithDateTree(
            archiveSection.blockContent,
            newlyCompletedTasks
        );
    }

    private getArchiveSectionFromRoot(section: Section) {
        let archiveSection = section.children.find((s) =>
            this.archiveHeadingPattern.test(s.text)
        );
        if (!archiveSection) {
            if (this.settings.addNewlinesAroundHeadings) {
                Archiver.addNewlinesToSectionIfNeeded(section);
            }
            const heading = this.buildArchiveHeading();
            const rootBlock = new RootBlock();
            archiveSection = new Section(heading, rootBlock);
            section.appendChild(archiveSection);
        }
        return archiveSection;
    }

    private async parseFile(file: TFile) {
        if (file === null || file.extension !== "md") {
            throw new Error("The archiver works only in markdown (.md) files!");
        }
        const fileContents = await this.vault.read(file);
        return this.parser.parse(fileContents.split("\n"));
    }

    private extractNewlyCompletedTasks(tree: Section) {
        // TODO: the AST should not leak details about bullets or heading tokens
        const completedTaskPattern = /^(?:[-*]|\d+\.) \[x]/;
        const isCompletedTask = (block: Block) =>
            block instanceof ListBlock && completedTaskPattern.test(block.text);

        const isSectionAnythingExceptArchive = (section: Section) =>
            !this.archiveHeadingPattern.test(section.text);

        const filter = {
            blockFilter: isCompletedTask,
            sectionFilter: isSectionAnythingExceptArchive,
        };
        return tree.extractBlocksRecursively(filter);
    }

    private async getArchiveFileFor(activeFile: TFile) {
        const archiveFileName = `${this.settings.defaultArchiveFileName.replace(
            "%",
            activeFile.basename
        )}.md`;

        let archiveFile =
            this.vault.getAbstractFileByPath(archiveFileName) ||
            (await this.createFile(archiveFileName));

        if (archiveFile instanceof TFile) {
            return archiveFile;
        }

        throw new Error(`${archiveFileName} is not a valid markdown file`);
    }

    private async createFile(name: string) {
        return await this.vault.create(name, "");
    }

    private async writeTreeToFile(file: TFile, tree: Section) {
        const indentation = buildIndentation(this.settings.indentationSettings);
        const treeLines = tree.stringify(indentation).join("\n");
        await this.vault.modify(file, treeLines);
    }

    private buildArchiveHeading() {
        const headingToken = "#".repeat(this.settings.archiveHeadingDepth);
        return `${headingToken} ${this.settings.archiveHeading}`;
    }
}
