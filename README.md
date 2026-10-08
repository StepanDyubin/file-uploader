# Frontify Frontend Live Coding Task

## Solution

The upload is split in two, so each half can be replaced without touching the other:

- **Logic: the [`useFileUploader`](src/client/components/FileUpload/useFileUploader/useFileUploader.ts) hook.** It owns
  the queue, chunking, progress, cancel and retry. It renders nothing and does not know the server: the two functions
  that send data ([filesApi.ts](src/client/api/filesApi.ts)) are passed in.
- **UI: the [`FileUpload.*`](src/client/components/FileUpload/FileUpload.tsx) components.** They only render what they
  are given and report user actions. They hold no upload state.

Both are exported from [src/client/components/FileUpload](src/client/components/FileUpload/index.ts).

A complete uploader is the hook wired to the parts:

```tsx
import { uploadChunk, uploadSingle } from './api/filesApi';
import { FileUpload, useFileUploader } from './components/FileUpload';

export const Uploader = () => {
    const { files, upload, retry, remove } = useFileUploader({
        uploadFn: uploadSingle,
        uploadChunkFn: uploadChunk,
    });

    return (
        <FileUpload.Root>
            <FileUpload.Dropzone onFiles={upload} />
            <FileUpload.List title="Uploads">
                {files.map((file) => (
                    <FileUpload.Item key={file.id} file={file} onRetry={retry} onRemove={remove} />
                ))}
            </FileUpload.List>
        </FileUpload.Root>
    );
};
```

The app shows three ways to combine them, one per tab, in [src/client/examples](src/client/examples/):
[DropzoneExample](src/client/examples/DropzoneExample.tsx), [ButtonExample](src/client/examples/ButtonExample.tsx) and
[CustomUploads](src/client/examples/CustomUploads.tsx).

### To improve

**Handle duplicates.** Nothing checks whether a file with the same name is already in the queue or on the server.

**Optimize the file storage.** The files are an array, so every progress update runs `map` over the whole list to
change one item ([useFileUploader.ts:49-51](src/client/components/FileUpload/useFileUploader/useFileUploader.ts#L49-L51)).

**Resume from the last uploaded chunk.** Retry sends a chunked file again from the first chunk.

**Prevent silent cancel on leave or unmount.** Closing the page or unmounting the component aborts running uploads
without a warning.

**Validate size and extension.** Any file is accepted and sent, whatever its size or type.

## Task

Uploading digital assets is one of the core parts of Frontify. The feature must work seamlessly and with a good user
experience, as thousands of files in many sizes and formats are ingested daily through our web application.

We have been tasked with the creation of a new reusable File Upload React component that meets the following criteria:
- Allows uploading and listing existing files through an existing Http API.
- Adheres to accessibility standards.
- Is designed to be easily extended for different use cases.
- Is adequately tested.

Design your components in a way that makes them easy to extend and customize. Implement your own upload functionality to
show us how you would solve this problem.

Build a view that wires your component(s) against the provided API to upload new files and list the existing ones.

Important: Before starting the implementation, please provide a brief description of the solution you are planning to
implement, including any major assumptions you are making and a possible high-level architecture or design.

---

## Constraints

Use the provided TypeScript and React boilerplate to get started. Tailwind CSS is used for styling and Vitest for
testing. Feel free to modify it to your needs, but please let us know the reasonings behind your changes.

Use the provided server to upload files. You can find the API documentation below.

This isn't a memory test, so don't worry about having to look for the exact syntax of a function or method or any other
minor details. You can use any resources you will typically use in your day-to-day work.

We don't expect a fully functional solution but a well-structured and tested codebase that demonstrates your
understanding of the problem and your approach towards solving it. It's okay to cut corners, but please let us know
what you would do differently if you had more time or if you were working on an actual project.

---

## API

You can find the Express code for the server API under `src/server`. You can use it and/or modify it to your needs.

It provides for you the following endpoints:

### List of files

```http
GET /api/files
```

##### Responses:

- On success:

  `HTTP 200`
  ```json
  {
    "files": [
      {
        "name": "string",
        "size": "number",
      }
    ]
  }
  ```

  Example:
  ```json
  {
    "files": [
      { "name": "file1.jpg", "size": 1024 },
      { "name": "file2.jpg", "size": 2048 }
    ]
  }
  ```

- On unexpected error:

  `HTTP 500`
  ```json
  {
    "message": "string"
  }
  ```

  Example:
  ```json
  { "message": "An error occurred" }
  ```

### Upload a single file

```http
POST /api/upload-single
```

Content-Type: `multipart/form-data`

| Body parameter | Type   | Description                      |
| :------------- | :----- | :------------------------------- |
| `file`         | `file` | **Required**. The file to upload |

##### Responses:

- On success

  `HTTP 200`
  ```json
  { "message": "File uploaded successfully" }
  ```

- On invalid request:

  `HTTP 400`
  ```json
  { "error": "Missing required `file` key in body." }
  ```

- On unexpected error:

  `HTTP 500`
  ```json
  { "error": "Error saving file" }
  ```

### Upload a file in chunks

```http
POST /api/upload-chunk
```

| Body parameter      | Type     | Description                                  |
| :------------------ | :------- | :------------------------------------------- |
| `file`              | `file`   | **Required**. The file to upload             |
| `currentChunkIndex` | `number` | **Required**. The current chunk index number |
| `totalChunks`       | `number` | **Required**. The total number of chunks     |

##### Responses:

- On success

  `HTTP 200`
  ```json
  { "message": "Chunked file uploaded successfully" }
  ```

- On invalid request:

  `HTTP 400`
  ```json
  { "error": "string" }
  ```

    Example:
    ```json
    { "error": "Missing required parameters" }
    ```

- On unexpected error:

  `HTTP 500`
  ```json
  { "error": "Error saving chunk" }
  ```
