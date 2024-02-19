import { startProcrastinationSession } from "./util";
import { LaunchType, closeMainWindow, launchCommand, popToRoot } from "@raycast/api";

export default async function Command(props: { arguments: { title: string } }) {
  await startProcrastinationSession(props.arguments.title);
  launchCommand({ name: "proful", type: LaunchType.Background });
  popToRoot();
  closeMainWindow();
}
