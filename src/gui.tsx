import React, { FC } from "react";
import { Text, Newline, Static, Box, Spacer } from "ink";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import MultiSelect from "ink-multi-select";
import type TypedEmitter from "typed-emitter";

export interface GuiEvents {
  onSubmit: (item: Item) => void;
  onSelect: (item: Item) => void;
  onUnselect: (item: Item) => void;
  onHighlight: (item: Item) => void;
}

export interface Item {
  key: string;
  index: number;
  label: string;
  value: string;
  [key: string]: any;
}

interface Props {
  items: Item[];
  selectedItems: Item[];
  logs: string[];
  commandText: string;
  emitter: TypedEmitter<GuiEvents>;
}
export function Gui(props: Props) {
  const _emitter = props.emitter;
  function emit(key: keyof GuiEvents) {
    return (item: Item) => {
      _emitter.emit(key, item);
    };
  }
  return (
    <>
      <Static items={["morn"]}>
        {(title) => <Morn key={title} text={title}></Morn>}
      </Static>

      <Box width={100}>
        {/* @ts-expect-error */}
        <MultiSelect
          items={props.items}
          selected={props.selectedItems}
          onSubmit={emit("onSubmit")}
          onSelect={emit("onSelect")}
          onUnselect={emit("onUnselect")}
          onHighlight={emit("onHighlight")}
        />
        <Box marginLeft={10}>
          <Text color="green">{props.commandText}</Text>
        </Box>
      </Box>
      <Box width={100} flexDirection={"column"} borderStyle={"single"}>
        {props.logs.map((log, index) => {
          return <Text key={index}>{log}</Text>;
        })}
      </Box>
    </>
  );
}

const Morn = ({ text }: { text: string }) => {
  return (
    <Gradient name="fruit">
      <BigText text={text} />
    </Gradient>
  );
};
