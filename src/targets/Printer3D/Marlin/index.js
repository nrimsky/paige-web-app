/*
 index.js - ESP3D WebUI Target file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
import { h } from "preact";
import { Fan, Bed, FeedRate, FlowRate, Extruder } from "./icons";
import { FilesPanelElement } from "../../../components/Panel/Files";
import { MacrosPanelElement } from "../../../components/Panel/Macros";
import { TerminalPanelElement } from "../../../components/Panel/Terminal";
import {
  compareStrings,
  formatFileSizeToString,
} from "../../../components/Helpers";
import {
  TargetContextProvider,
  useTargetContext,
  useTargetContextFn,
} from "./TargetContext";
import { useUiContextFn } from "../../../contexts";

const Target = "Marlin";
const Name = "ESP3D";
const fwUrl = "https://github.com/luc-github/ESP3D/tree/3.0";
const iconsTarget = {
  Fan: <Fan />,
  Bed: <Bed />,
  FeedRate: <FeedRate />,
  FlowRate: <FlowRate />,
  Extruder: <Extruder />,
};

const defaultPanelsList = [
  FilesPanelElement,
  TerminalPanelElement,
  MacrosPanelElement,
];

const restartdelay = 30;

//only one query at once
const onGoingQuery = {
  fs: "",
  command: "",
  started: false,
  content: [],
  feedback: null,
  startTime: 0,
};
const catchResponse = (fs, command, feedbackfn) => {
  console.log("init catch");
  onGoingQuery.fs = fs;
  onGoingQuery.command = command;
  onGoingQuery.startTime = window.performance.now();
  onGoingQuery.started = false;
  onGoingQuery.ended = false;
  onGoingQuery.content = [];
  onGoingQuery.feedback = feedbackfn;
};

//steps
const querySteps = {
  SD: {
    list: {
      start: (data) => data.startsWith("Begin file list"),
      end: (data) => data.startsWith("End file list"),
      error: (data) => {
        return data.indexOf("error") != -1;
      },
    },
  },
};

const canProcessFile = (filename) => {
  const filters = useUiContextFn.getValue("filesfilter").split(";");
  for (let index = 0; index < filters.length; index++) {
    if (
      filters[index] == "*" ||
      filename.trim().endsWith("." + filters[index])
    ) {
      return true;
    }
  }
  return false;
};

const sortedFilesList = (filesList) => {
  //files alphabeticaly then folders alphabeticaly
  filesList.sort(function (a, b) {
    return compareStrings(a.name, b.name);
  });
  filesList.sort(function (a, b) {
    return a.size == -1 && b.size != -1
      ? 1
      : a.size != -1 && b.size == -1
      ? -1
      : 0;
  });
  return filesList;
};

const formatSerialLine = (acc, line) => {
  const elements = line.split(" ");
  if (elements.length != 2) return acc;
  //TODO check it is valid file name / size
  acc.push({ name: elements[0], size: formatFileSizeToString(elements[1]) });
  return acc;
};

const filterResultFiles = (files, path) => {
  const folderList = [];
  return files.reduce((acc, element) => {
    //TODO filter according  path
    if (path == "/") {
      if (!element.name.startsWith("/")) acc.push(element);
      else {
        //it is directory
        const name = element.name.substring(1, element.name.indexOf("/", 1));
        if (!folderList.includes(name)) {
          folderList.push(name);
          acc.push({ name, size: "-1" });
        }
      }
    } else {
      //it is sub file
      if (element.name.startsWith(path + "/")) {
        let newpath = element.name.substring(path.length + 1);
        //it is file or subfile ?
        if (newpath.indexOf("/") == -1) {
          //file
          acc.push({ name: newpath, size: element.size });
        } else {
          const foldername = newpath.substring(0, newpath.indexOf("/"));
          if (!folderList.includes(foldername)) {
            folderList.push(foldername);
            acc.push({ name: foldername, size: "-1" });
          }
        }
      }
    }

    return acc;
  }, []);
};

const formatStatus = (status) => {
  if (status == "ok") return "S126";
  return status;
};

const supportedFileSystems = [
  { value: "FLASH", name: "S137", depend: "showfilespanel" },
  { value: "SD", name: "S190", depend: "sd" },
  { value: "SDEXT", name: "S191", depend: "sdext" },
  { value: "TFTSD", name: "S188", depend: "tftsd" },
  { value: "TFTUSB", name: "S189", depend: "tftusb" },
];

const capabilities = {
  FLASH: {
    Process: () => false,
    UseFilters: () => false,
    IsFlatFS: () => false,
    Upload: () => {
      return true;
    },
    Mount: () => {
      return false;
    },
    UploadMultiple: () => {
      return true;
    },
    Download: () => {
      return true;
    },
    DeleteFile: () => {
      return true;
    },
    DeleteDir: () => {
      return true;
    },
    CreateDir: () => {
      return true;
    },
  },

  SD: {
    Process: (path, filename) => {
      return canProcessFile(filename);
    },
    UseFilters: () => true,
    IsFlatFS: () => true,
    Upload: (path, filename, eMsg = false) => {
      if (eMsg) return "E1";
      //TODO
      //check 8.1 if become true
      return false;
    },
    UploadMultiple: () => {
      return false;
    },
    Download: () => {
      return false;
    },
    DeleteFile: () => {
      return true;
    },
    DeleteDir: () => {
      return true;
    },
    CreateDir: () => {
      return true;
    },
  },
  SDEXT: {
    Process: (path, filename) => {
      return canProcessFile(filename);
    },
  },
  TFTUSB: {
    Process: (path, filename) => {
      return canProcessFile(filename);
    },
  },
  TFTSD: {
    Process: (path, filename) => {
      return canProcessFile(filename);
    },
  },
};

const commands = {
  FLASH: {
    list: (path, filename) => {
      return {
        type: "url",
        url: "files",
        args: { path, action: "list" },
      };
    },
    upload: (path, filename) => {
      return {
        type: "url",
        url: "files",
        args: { path },
      };
    },
    formatResult: (resultTxT) => {
      const res = JSON.parse(resultTxT);
      res.files = sortedFilesList(res.files);
      res.status = formatStatus(res.status);
      return res;
    },

    deletedir: (path, filename) => {
      return {
        type: "url",
        url: "files",
        args: { path, action: "deletedir", filename },
      };
    },
    delete: (path, filename) => {
      return {
        type: "url",
        url: "files",
        args: { path, action: "delete", filename },
      };
    },
    createdir: (path, filename) => {
      return {
        type: "url",
        url: "files",
        args: { path, action: "createdir", filename },
      };
    },
    download: (path, filename) => {
      return {
        type: "url",
        url: path + (path.endsWith("/") ? "" : "/") + filename,
        args: {},
      };
    },
  },
  SD: {
    list: (path, filename) => {
      return { type: "cmd", cmd: "M21\nM20 " + path };
    },
    formatResult: (result) => {
      const res = {};
      const files = result.content.reduce((acc, line) => {
        return formatSerialLine(acc, line);
      }, []);
      res.files = sortedFilesList(files);
      res.status = formatStatus(result.status);
      return res;
    },
    filterResult: (data, path) => {
      const res = {};
      res.files = sortedFilesList(filterResultFiles(data.files, path));
      res.status = formatStatus(data.status);
      return res;
    },
    play: (path, filename) => {
      return { type: "cmd", cmd: "M23 " + path + filename + "\nM24" };
    },
  },
  SDEXT: {
    list: (path, filename) => {
      return { type: "cmd", cmd: "M20 " + path };
    },
    formatResult: (resultTxT) => {
      return { status: "ok" };
    },
  },
  TFTUSB: {
    list: (path, filename) => {
      return { type: "cmd", cmd: "M20 USB:" + path };
    },
    formatResult: (resultTxT) => {
      return { status: "ok" };
    },
  },
  TFTSD: {
    list: (path, filename) => {
      return { type: "cmd", cmd: "M20 SD:" + path };
    },
    formatResult: (resultTxT) => {
      return { status: "ok" };
    },
  },
};

function capability() {
  const [filesystem, cap, ...rest] = arguments;
  if (capabilities[filesystem] && capabilities[filesystem][cap])
    return capabilities[filesystem][cap](...rest);
  console.log("Unknow capability ", cmd, " for ", filesystem);
  return false;
}

function command() {
  const [filesystem, cmd, ...rest] = arguments;
  if (commands[filesystem] && commands[filesystem][cmd])
    return commands[filesystem][cmd](...rest);
  console.log("Unknow command ", cmd, " for ", filesystem);
  return { type: "error" };
}

const files = {
  command,
  capability,
  catchResponse,
  supported: supportedFileSystems,
};

const filesPanelProcessor = (type, data) => {
  if (onGoingQuery.fs != "" && onGoingQuery.command != "" && type == "stream") {
    const step = querySteps[onGoingQuery.fs][onGoingQuery.command];
    if (!onGoingQuery.started) {
      //allow 30s for start answer
      if (window.performance.now() - onGoingQuery.startTime > 30000) {
        onGoingQuery.feedback({ status: "error", content: "timeout" });
        console.log("timeout wait for start");
        catchResponse("", "", null);
        return;
      }
      if (step.start(data)) {
        onGoingQuery.started = true;
        onGoingQuery.startTime = window.performance.now();
      }
    } else {
      if (step.end(data)) {
        onGoingQuery.feedback({
          status: "ok",
          content: [...onGoingQuery.content],
        });
        catchResponse("", "", null);
      } else {
        if (step.error(data)) {
          if (onGoingQuery.feedback)
            onGoingQuery.feedback({ status: "error", content: data });
          catchResponse("", "", null);
        } else {
          //4 min Timeout if answer started but no end
          if (window.performance.now() - onGoingQuery.startTime > 4 * 60000) {
            onGoingQuery.feedback({ status: "error", content: "timeout" });
            catchResponse("", "", null);
            console.log("timeout wait for end");
          } else {
            onGoingQuery.content.push(data);
          }
        }
      }
    }
  }
};

export {
  Target,
  fwUrl,
  Name,
  files,
  iconsTarget,
  restartdelay,
  defaultPanelsList,
  TargetContextProvider,
  useTargetContext,
  useTargetContextFn,
  filesPanelProcessor,
};
