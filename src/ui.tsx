import React, { FC } from "react";
import { Text, Newline, Static, Box, Spacer } from "ink";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import TextInput from "ink-text-input";
import fs from "fs";
import MultiSelect from "ink-multi-select";
import { cosmiconfig, cosmiconfigSync } from "cosmiconfig";
import { getAllCosmicFolders } from "./utils";
import { spawnProcess } from "./spawn-process";
import treeKill from "tree-kill";

// Search for a configuration by walking up directories.
// See documentation for search, below.

const fsp = fs.promises;

// START DIR
const CWD = "./dummy-git";
// const CWD = "..";

const explorer = cosmiconfigSync("morn", {
  stopDir: CWD,
});

export const App: FC<{ name?: string }> = ({ name = "Stranger" }) => {
  const [highlightText, setHighlightText] = React.useState(name);
  const [startedFolders, setSubmittedFolders] = React.useState([] as any[]);
  const [folders, setFolders] = React.useState([] as any[]);
  const [logs, setLogs] = React.useState([] as string[]);
  const [selected, setSelected] = React.useState([] as any[]);
  const [spawns, setSpawn] = React.useState({} as any);
  function addSelected(item: any) {
    setSelected([...selected, item]);
  }
  function removeSelected(item: any) {
    setSelected(selected.filter((s) => s.label !== item.label));
  }

  //@ts-ignore
  React.useEffect(() => {
    async function work() {
      const folders = await getAllCosmicFolders(CWD);
      return folders;
    }

    work().then((onlyFolderItems) => {
      setFolders(onlyFolderItems);
    });
  }, []);

  const handleSubmit = (items: any) => {
    setSubmittedFolders(items);
  };

  const handleSelect = async (item: any) => {
    addSelected(item);
    const selectedFolder = `${CWD}/${item.label}`;
    const config = explorer.search(selectedFolder);

    if (config === null) {
      return setHighlightText("nothing");
    }
    const start = config.config.start ?? "no start config";
    // const argv = config.config.startArgs ?? [""];
    // console.log(`start, ${start} ${argv}`);

    const spawn = spawnProcess({
      cwd: selectedFolder,
      start: start,
      startArgs: config.config.startArgs,
      onLog: (msg) => {
        console.log("setLogs", msg, logs);
        setLogs([...logs, msg]);
      },
      onExit: () => {
        removeSelected(item);
      },
    });
    setSpawn({
      ...spawns,
      [item.label]: spawn,
    });
  };

  const handleUnSelect = async (item: any) => {
    removeSelected(item);

    const spawn = spawns[item.label];

    if (spawn) {
      setSpawn({
        ...spawns,
        [item.label]: undefined,
      });
      // kill child and children of child :|
      treeKill(spawn.pid);
    }
    // const config = explorer.search(`${CWD}/${item.label}`);

    // if (config === null) {
    //   return setHighlightText("nothing");
    // }
    // const stop = config.config.stop ?? "no stop config";
    // const argv = config.config.stopArgs?.join(" ") ?? "no stopArgs config";
    // console.log(`stop, ${stop} ${argv}`);
  };

  const handleHighlight = async (item: any) => {
    const config = explorer.search(`${CWD}/${item.label}`);

    if (config === null) {
      return setHighlightText("nothing");
    }
    // get "start" config
    setHighlightText(
      `${config.config.start ?? "no start config"} ${
        config.config.startArgs?.join(" ") ?? "no start config"
      }`
    );
  };

  return (
    <>
      <Static items={["morn"]}>
        {(title) => <Morn key={title} text={title}></Morn>}
      </Static>
      <Box width={100}>
        <MultiSelect
          items={folders}
          selected={selected}
          onSubmit={handleSubmit}
          onSelect={handleSelect}
          onUnselect={handleUnSelect}
          //@ts-ignore
          onHighlight={handleHighlight}
        />

        {/* <TextInput value={text} onChange={setText} /> */}
        {/* <Spacer /> */}
        <Box marginLeft={10}>
          <Text color="green">{highlightText}</Text>
        </Box>
      </Box>

      <Box>
        <Text>Heyo!</Text>
      </Box>
      <Box>
        {logs.map((log, i) => {
          return <Text key={i}>{log}</Text>;
        })}
        {/* {logs.map(log, i) => <Text key={i}>{log}</Text>}} */}
      </Box>
    </>
  );
};

interface SelectedFolder {
  label: string;
  value: string;
  directory: string;
}
interface ExampleProps {
  selectedFolders: SelectedFolder[];
}

const Morn = ({ text }: { text: string }) => {
  return (
    <Gradient name="fruit">
      <BigText text={text} />
    </Gradient>
  );
};
