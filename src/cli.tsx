#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { Gui, GuiEvents, Item } from "./gui";
import fg from "fast-glob";
import path from "path";
import { EventEmitter } from "events";
import { spawnProcess } from "./spawn-process";
import type TypedEmitter from "typed-emitter";
import treeKill from "tree-kill";
import { Writable, Transform, pipeline } from "stream";

const cwd = process.cwd();

const items: Item[] = [];

let index = 0;
const configToItem = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const file = chunk.toString("utf-8");
    const absoluteFilepath = `${cwd}/${file}`;
    import(absoluteFilepath).then((exported) => {
      const { start, startArgs } = exported;
      const config = {
        start: start as string,
        startArgs: startArgs as string[],
        configPath: file,
        directory: path.dirname(absoluteFilepath),
      };

      const item = {
        index: index++,
        key: config.configPath,
        label: config.configPath,
        value: `${config.configPath}`,
        directory: config.directory,
        start: config.start,
        startArgs: config.startArgs,
      };

      // callback(null, JSON.stringify(item, null, 2));
      callback(null, item);
    });
  },
});
main();
async function main() {
  const itemStream = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      items.push(chunk);
      reRender();
      callback(null);
    },
  });

  // START DIR
  const files = fg.stream(["../**/morn.config.js", "!**/node_modules"], {
    deep: 4,
  });

  pipeline(files, configToItem, itemStream, (err) => {
    if (err) {
      console.error("something went wrong", err);
    } else {
      console.log("stream went fine");
    }
  });

  const messageEmitter = new EventEmitter() as TypedEmitter<GuiEvents>;

  let logs: string[] = [];

  messageEmitter.on("onSubmit", (item) => {
    console.log("onSubmit", item);
    reRender();
  });

  let highLightedIndex = 0;
  messageEmitter.on("onHighlight", (item) => {
    highLightedIndex = item.index;
    reRender();
  });

  let selectedItems: number[] = [];
  let spawnedItems: ReturnType<typeof spawnProcess>[] = [];
  messageEmitter.on("onSelect", (item) => {
    handleStart(item.index);
    selectedItems.push(item.index);
    reRender();
  });

  messageEmitter.on("onUnselect", (unSelectedItem) => {
    selectedItems = selectedItems.filter(
      (index) => unSelectedItem.index !== index
    );
    const process = assertValid(spawnedItems[unSelectedItem.index]);

    // kill child and children of child :|
    treeKill(process.pid);
    reRender();
  });

  function reRender() {
    const highLightedItem = assertValid(items[highLightedIndex]);
    const commandText = `${
      highLightedItem.start
    } - ${highLightedItem.startArgs.join(" ")}`;
    render(
      <Gui
        items={items}
        selectedItems={selectedItems.map((i) => assertValid(items[i]))}
        logs={logs}
        commandText={commandText}
        emitter={messageEmitter}
      />
    );
  }

  function handleStart(index: number) {
    const item = assertValid(items[index]);

    const process = spawnProcess({
      cwd: item.directory,
      onLog: (log) => {
        logs.push(log);
        logs = logs.slice(-50);
        reRender();
      },
      onExit: (_code) => {
        selectedItems = selectedItems.filter(
          (otherIndex) => index !== otherIndex
        );
        const process = assertValid(spawnedItems[index]);

        // kill child and children of child :|
        treeKill(process.pid);
        reRender();
      },
      start: item.start,
      startArgs: item.startArgs,
    });

    spawnedItems[index] = process;
  }
}

type FalsyValues = undefined | null | false | 0;
/**
 * Throws on falsy value (including 0) to give a T without FalsyValues
 */
export function assertValid<T>(value: T | FalsyValues, errorMessage = ""): T {
  if (!value) {
    throw new Error(`assertValid: ${errorMessage} (${value})`);
  }
  return value;
}
