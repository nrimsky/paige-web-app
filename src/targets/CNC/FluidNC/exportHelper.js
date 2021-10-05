/*
 importHelper.js - ESP3D WebUI Target file

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
import { Fragment, h } from "preact";

const formatArrayToYaml = (formatedArray) => {
  const res = arrayData.reduce((acc, line) => {
    if (line.type != "newline") {
      for (let i = 0; i < line.indentation; i++) acc += " ";
      acc += line.label + ":";
      if (line.type == "entry") acc += " " + line.value;
    }
    acc += "\n";
    return acc;
  }, "");
  return res;
};

const saveArrayYamlToLocalFile = (formatedArray, filename) => {
  const file = new Blob([formatArrayToYaml(formatedArray)], {
    type: "application/json",
  });
  if (window.navigator.msSaveOrOpenBlob)
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
};

const saveArrayYamlToFS = (formatedArray, filename) => {
  const blob = new Blob([formatArrayToYaml(formatedArray)], {
    type: "text/plain",
  });

  const formData = new FormData();
  const file = new File([blob], filename);
  formData.append("path", "/");
  formData.append(filename + "S", filename.length);
  formData.append("myfiles", file, filename);
  setIsLoading(true);
  createNewRequest(
    espHttpURL("files").toString(),
    { method: "POST", id: "yamlconfig", body: formData },
    {
      onSuccess: (result) => {
        setIsLoading(false);
      },
      onFail: (error) => {
        setIsLoading(false);
      },
    }
  );
};

export { formatArrayToYaml };
