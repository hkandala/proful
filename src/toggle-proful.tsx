import { toggleProfulVisibility } from "./util";
import { LaunchType, closeMainWindow, launchCommand, popToRoot } from "@raycast/api";

export default async function Command() {
  toggleProfulVisibility();
  launchCommand({ name: "proful", type: LaunchType.Background });
  popToRoot();
  closeMainWindow();
}
