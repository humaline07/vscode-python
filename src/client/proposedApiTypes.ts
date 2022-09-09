// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Event, Uri, WorkspaceFolder } from 'vscode';

// https://github.com/microsoft/vscode-python/wiki/Proposed-Environment-APIs

export interface IProposedExtensionAPI {
    environment: {
        /**
         * This event is triggered when the active environment changes.
         */
        onDidChangeActiveEnvironment: Event<ActiveEnvironmentChangedParams>;
        /**
         * Returns the path to the python binary selected by the user or as in the settings.
         * This is just the path to the python binary, this does not provide activation or any
         * other activation command. The `resource` if provided will be used to determine the
         * python binary in a multi-root scenario. If resource is `undefined` then the API
         * returns what ever is set for the workspace.
         * @param resource : Uri of a file or workspace
         */
        getActiveEnvironmentPath(resource?: Resource): Promise<EnvironmentPath | undefined>;
        /**
         * Returns details for the given environment path, or `undefined` if the env is invalid.
         * @param pathID : Full path to environment folder or python executable whose details you need.
         */
        getEnvironmentDetails(pathID: UniquePathType | EnvironmentPath): Promise<EnvironmentDetails | undefined>;
        /**
         * Returns current in-memory details for the given environment path if any, even if there's partial data.
         * Only returns if the final type and name of an environment is known.
         * @param pathID : Full path to environment folder or python executable whose details you need.
         */
        getEnvironmentDetailsSync(pathID: UniquePathType | EnvironmentPath): PartialEnvironmentDetails | undefined;
        /**
         * Sets the active environment path for the python extension for the resource. Configuration target
         * will always be the workspace folder.
         * @param pathID : Full path to environment folder or python executable to set.
         * @param resource : [optional] Uri of a file ro workspace to scope to a particular workspace
         *                   folder.
         */
        setActiveEnvironment(pathID: UniquePathType | EnvironmentPath, resource?: Resource): Promise<void>;
        locator: {
            /**
             * Returns paths to environments that uniquely identifies an environment found by the extension
             * at the time of calling. It returns the values currently in memory, which carries what is
             * known so far. To get complete list `await` on promise returned by `getRefreshPromise()`.
             */
            getEnvironments(): UniquePathType[] | undefined;
            /**
             * This event is triggered when the known environment list changes, like when a environment
             * is found, existing environment is removed, or some details changed on an environment.
             */
            onDidChangeEnvironments: Event<EnvironmentsChangedParams>;
            /**
             * Returns a promise for the ongoing refresh. Returns `undefined` if there are no active
             * refreshes going on.
             */
            getRefreshPromise(): Promise<void> | undefined;
            /**
             * Tracks discovery progress for current list of known environments, i.e when it starts, finishes or any other relevant
             * stage.
             */
            readonly onRefreshProgress: Event<ProgressNotificationEvent>;
        };
    };
}

export enum Architecture {
    Unknown = 1,
    x86 = 2,
    x64 = 3,
}

export type EnvSource = KnownEnvSources | string;
export type KnownEnvSources = 'Conda' | 'Pipenv' | 'Poetry' | 'VirtualEnv' | 'Venv' | 'VirtualEnvWrapper' | 'Pyenv';

export type EnvType = KnownEnvTypes | string;
export type KnownEnvTypes = 'VirtualEnv' | 'Conda' | 'Unknown';

export type BasicVersionInfo = {
    major: number;
    minor: number;
    micro: number;
};

/**
 * The possible Python release levels.
 */
export enum PythonReleaseLevel {
    Alpha = 'alpha',
    Beta = 'beta',
    Candidate = 'candidate',
    Final = 'final',
}

/**
 * Release information for a Python version.
 */
export type PythonVersionRelease = {
    level: PythonReleaseLevel;
    serial: number;
};

export type StandardVersionInfo = BasicVersionInfo & {
    release?: PythonVersionRelease;
};

// To be added later:
// run: {
//     exec: Function;
//     shellExec: Function;
//     execObservable: Function;
//     terminalExec: () => void;
//     env?: { [key: string]: string | null | undefined };
// };

export interface EnvironmentDetails {
    pathID: UniquePathType;
    executable: {
        path: string;
        bitness?: Architecture;
        sysPrefix: string;
    };
    environment:
        | {
              type: EnvType;
              name?: string;
              folderPath: string;
              /**
               * Any specific workspace folder this environment is created for.
               * What if that workspace folder is not opened yet? We should still provide a workspace folder so it can be filtered out.
               * WorkspaceFolder type won't work as it assumes the workspace is opened, hence using URI.
               */
              workspaceFolder?: Uri;
              source: EnvSource[];
          }
        | undefined;
    version: StandardVersionInfo & {
        sysVersion?: string;
    };
    implementation?: {
        name: string;
        version: StandardVersionInfo;
    };
}

export interface PartialEnvironmentDetails {
    pathID: UniquePathType;
    executable: {
        path: string;
        bitness?: Architecture;
        sysPrefix?: string;
    };
    environment:
        | {
              type: EnvType;
              name: string | undefined;
              folderPath: string;
              /**
               * Any specific workspace folder this environment is created for.
               * What if that workspace folder is not opened yet? We should still provide a workspace folder so it can be filtered out.
               * WorkspaceFolder type won't work as it assumes the workspace is opened, hence using URI.
               */
              workspaceFolder?: Uri;
              source: EnvSource[];
          }
        | undefined;
    version: Partial<StandardVersionInfo> & {
        sysVersion?: string;
    };
    implementation?: {
        name: string;
        version: Partial<StandardVersionInfo>;
    };
}

export enum ProgressReportStage {
    discoveryStarted = 'discoveryStarted',
    discoveryFinished = 'discoveryFinished',
}

export type ProgressNotificationEvent = {
    stage: ProgressReportStage;
};

/**
 * Uri of a file inside a workspace or workspace folder itself.
 */
export type Resource = Uri | WorkspaceFolder;

/**
 * Path to environment folder or path to python executable that uniquely identifies an environment.
 * Environments lacking a python executable are identified by environment folder paths,
 * whereas other envs can be identified using python executable path.
 */
export type UniquePathType = string;

export interface EnvironmentPath {
    pathID: UniquePathType;
    /**
     * Path to python executable that uniquely identifies an environment.
     * Carries `undefined` if an executable cannot uniquely identify an
     * environment or does not exist within the env.
     */
    executablePath: string | undefined;
}

export type EnvironmentsChangedParams = {
    pathID: UniquePathType;
    /**
     * * "add": New environment is added.
     * * "remove": Existing environment in the list is removed.
     * * "update": New information found about existing environment.
     */
    type: 'add' | 'remove' | 'update';
};

export interface ActiveEnvironmentChangedParams {
    pathID: UniquePathType;
    /**
     * Workspace folder the environment changed for.
     */
    resource: WorkspaceFolder | undefined;
}
