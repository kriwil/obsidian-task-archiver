import classNames from "classnames";
import { For, Show, createSignal } from "solid-js";

import { Accordion } from "./Accordion";
import { DateFormatDescription } from "./DateFormatDescription";
import { HeadingTreeDemo } from "./HeadingTreeDemo";
import { HeadingsSettings } from "./HeadingsSettings";
import { ListItemTreeDemo } from "./ListItemTreeDemo";
import { ListItemsSettings } from "./ListItemsSettings";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { Rule } from "./Rule";
import { TaskPatternSettings } from "./TaskPatternSettings";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { ButtonSetting } from "./setting/ButtonSetting";
import { DropDownSetting } from "./setting/DropDownSetting";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";
import { ToggleSetting } from "./setting/ToggleSetting";

import { DEFAULT_DATE_FORMAT, NON_BREAKING_SPACE } from "../../Constants";
import { TaskSortOrder } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface ArchiverSettingsPageProps {
  placeholderService: PlaceholderService;
}

export function ArchiverSettingsPage(props: ArchiverSettingsPageProps) {
  const [settings, setSettings] = useSettingsContext();
  const [active, setActive] = createSignal(false);

  const replacementResult = () =>
    settings.textReplacement.replacementTest.replace(
      new RegExp(settings.textReplacement.regex),
      settings.textReplacement.replacement
    );

  return (
    <>
      <h1>Archiver Settings</h1>
      <DropDownSetting
        onInput={({ currentTarget: { value } }) => {
          // todo: handle this without an assertion?
          const asserted = value as TaskSortOrder;
          setSettings("taskSortOrder", asserted);
        }}
        name={"Order archived tasks"}
        options={[TaskSortOrder.NEWEST_LAST, TaskSortOrder.NEWEST_FIRST]}
        value={settings.taskSortOrder}
      />
      <ToggleSetting
        onClick={() => setSettings("sortAlphabetically", (prev) => !prev)}
        name="Sort top-level tasks alphabetically before archiving"
        value={settings.sortAlphabetically}
      />
      <ToggleSetting
        onClick={() => {
          setSettings("addNewlinesAroundHeadings", (prev) => !prev);
        }}
        name="Add newlines around the archive heading"
        value={settings.addNewlinesAroundHeadings}
      />
      <ToggleSetting
        name="Archive all checked tasks"
        description="Archive tasks with symbols other than 'x' (like '[>]', '[-]', etc.)"
        value={settings.archiveAllCheckedTaskTypes}
        onClick={() =>
          setSettings({
            archiveAllCheckedTaskTypes: !settings.archiveAllCheckedTaskTypes,
          })
        }
      />
      <TaskPatternSettings />
      <ToggleSetting
        name="Replace some text before archiving"
        description="You can use it to remove tags from your archived tasks. Note that this replacement is applied to all the list items in the completed task"
        onClick={() => {
          setSettings("textReplacement", "applyReplacement", (prev) => !prev);
        }}
        value={settings.textReplacement.applyReplacement}
      />
      <Show when={settings.textReplacement.applyReplacement} keyed>
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings("textReplacement", "regex", value);
          }}
          name={"Regular expression"}
          value={settings.textReplacement.regex}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings("textReplacement", "replacement", value);
          }}
          name="Replacement"
          value={settings.textReplacement.replacement}
          class="archiver-setting-sub-item"
        />
        <TextAreaSetting
          name="Try out your replacement"
          description={
            <>
              Replacement result: <b>{replacementResult()}</b>
            </>
          }
          onInput={({ currentTarget: { value } }) => {
            setSettings("textReplacement", "replacementTest", value);
          }}
          value={settings.textReplacement.replacementTest}
          class="archiver-setting-sub-item"
        />
      </Show>
      <ToggleSetting
        name="Archive to a separate file"
        description="If checked, the archiver will search for a file based on the pattern and will try to create it if needed"
        onClick={() => {
          setSettings({ archiveToSeparateFile: !settings.archiveToSeparateFile });
        }}
        value={settings.archiveToSeparateFile}
      />
      <Show when={settings.archiveToSeparateFile} keyed>
        <TextAreaSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings({ defaultArchiveFileName: value });
          }}
          name="File name"
          description={
            <PlaceholdersDescription placeholderResolver={props.placeholderService} />
          }
          value={settings.defaultArchiveFileName}
          class="archiver-setting-sub-item"
        />
        <Accordion>
          <TextSetting
            onInput={({ currentTarget: { value } }) => {
              setSettings({ dateFormat: value });
            }}
            name="Date format"
            description={<DateFormatDescription dateFormat={settings.dateFormat} />}
            value={settings.dateFormat}
            class="archiver-setting-sub-item"
          />
          <TextSetting
            onInput={({ currentTarget: { value } }) => {
              setSettings({ obsidianTasksCompletedDateFormat: value });
            }}
            name="obsidian-tasks completed date format"
            description={
              <DateFormatDescription
                dateFormat={settings.obsidianTasksCompletedDateFormat}
              />
            }
            value={settings.obsidianTasksCompletedDateFormat}
            class="archiver-setting-sub-item"
          />
        </Accordion>
      </Show>

      <ToggleSetting
        onClick={() => {
          setSettings("archiveUnderHeading", (prev) => !prev);
        }}
        name="Archive under headings"
        description="When disabled, no headings will get created"
        value={settings.archiveUnderHeading}
      />
      <Show when={settings.archiveUnderHeading} keyed>
        <DropDownSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings({ archiveHeadingDepth: Number(value) });
          }}
          name="First heading depth"
          options={["1", "2", "3", "4", "5", "6"]}
          value={String(settings.archiveHeadingDepth)}
          class="archiver-setting-sub-item"
        />
        <For each={settings.headings}>
          {(heading, index) => <HeadingsSettings heading={heading} index={index()} />}
        </For>

        <ButtonSetting
          onClick={() =>
            setSettings("headings", (prev) => [...prev, { text: "", dateFormat: "" }])
          }
          buttonText="Add heading"
        />

        <HeadingTreeDemo placeholderService={props.placeholderService} />
      </Show>

      <ToggleSetting
        onClick={() => {
          setSettings("archiveUnderListItems", (prev) => !prev);
        }}
        name="Archive under list items"
        value={settings.archiveUnderListItems}
      />
      <Show when={settings.archiveUnderListItems} keyed>
        <For each={settings.listItems}>
          {(listItem, index) => (
            <ListItemsSettings listItem={listItem} index={index()} />
          )}
        </For>

        <ButtonSetting
          onClick={() =>
            setSettings("listItems", (prev) => [
              ...prev,
              { text: "[[{{date}}]]", dateFormat: "" },
            ])
          }
          buttonText="Add list level"
        />

        <ListItemTreeDemo placeholderService={props.placeholderService} />
      </Show>

      <ToggleSetting
        onClick={() => {
          setSettings(
            "additionalMetadataBeforeArchiving",
            "addMetadata",
            (prev) => !prev
          );
        }}
        name={"Append some metadata to task before archiving"}
        value={settings.additionalMetadataBeforeArchiving.addMetadata}
      />
      <Show when={settings.additionalMetadataBeforeArchiving.addMetadata} keyed>
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings("additionalMetadataBeforeArchiving", "metadata", value);
          }}
          name="Metadata to append"
          description={
            <>
              <PlaceholdersDescription
                placeholderResolver={props.placeholderService}
                extraPlaceholders={[
                  [
                    "{{heading}}",
                    "resolves to the closest heading above the task; when there are none, defaults to file name",
                  ],
                ]}
              />
              <br />
              Current result:{" "}
              <code>
                - [x] water the cat #task{" "}
                {props.placeholderService.resolve(
                  settings.additionalMetadataBeforeArchiving.metadata,
                  {
                    dateFormat: settings.additionalMetadataBeforeArchiving.dateFormat,
                  }
                )}
              </code>
            </>
          }
          value={settings.additionalMetadataBeforeArchiving.metadata}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings("additionalMetadataBeforeArchiving", "dateFormat", value);
          }}
          name="Date format"
          description={
            <DateFormatDescription
              dateFormat={settings.additionalMetadataBeforeArchiving.dateFormat}
            />
          }
          value={settings.additionalMetadataBeforeArchiving.dateFormat}
          class="archiver-setting-sub-item"
        />
      </Show>

      <h2>Rules</h2>

      <BaseSetting description="Define rules for handling tasks that match certain conditions">
        <button
          onClick={() =>
            setSettings("rules", (prev) => [
              ...prev,
              // todo: same as getDefaultRule()
              {
                statuses: "",
                defaultArchiveFileName: "",
                dateFormat: DEFAULT_DATE_FORMAT,
                archiveToSeparateFile: true,
              },
            ])
          }
        >
          Add rule
        </button>
      </BaseSetting>
      <For each={settings.rules}>
        {(rule, index) => (
          <Rule index={index} placeholderResolver={props.placeholderService} />
        )}
      </For>
    </>
  );
}
