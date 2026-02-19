import { useCallback, useEffect, useRef, useState } from 'react'
import { mapRepository, placeRepository } from '../../lib/repositories'
import type { GameId } from '../../types/ids'
import type { Map } from '../../types/Map'
import {
  formatTopLevelPlaceName,
  deriveMapNameFromTopLevelPlaceName,
} from '../../utils/mapNames'

/** UI-only image source; 'none' means no image. */
type ImageSourceUi = 'none' | 'url' | 'upload'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Props for MapForm when creating a new map.
 */
export interface MapFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the map belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for MapForm when editing an existing map.
 */
export interface MapFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The map to edit. */
  map: Map
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for MapForm.
 */
export type MapFormProps = MapFormCreateProps | MapFormEditProps

/**
 * Checks if a file is a valid image file.
 *
 * @param file - The file to check.
 * @returns True if the file is a valid image file, false otherwise.
 */
function isValidImageFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

/**
 * Validates a URL.
 *
 * @param url - The URL to validate.
 * @returns The error message if the URL is invalid, null otherwise.
 */
function validateUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return 'Enter a valid http(s) URL.'
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'Enter a valid http(s) URL.'
    }
    return null
  } catch {
    return 'Enter a valid http(s) URL.'
  }
}

/**
 * Form to create or edit a map. Supports image from URL, file upload, or
 * drag-and-drop. Uses repositories so that creating a map also creates a
 * top-level place representing it for threads and the loom, while blob storage
 * remains encapsulated in the map repository.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the MapForm component.
 */
export function MapForm(props: MapFormProps): JSX.Element {
  const [name, setName] = useState(props.mode === 'edit' ? props.map.name : '')
  const [imageSourceUi, setImageSourceUi] = useState<ImageSourceUi>(() => {
    if (props.mode === 'create') return 'none'
    const m = props.map
    if (m.imageSourceType === 'upload' || m.imageBlobId) return 'upload'
    if (m.imageSourceType === 'url' || (m.imageUrl && m.imageUrl.trim() !== ''))
      return 'url'
    return 'none'
  })
  const [imageUrlInput, setImageUrlInput] = useState(
    props.mode === 'edit' && props.map.imageUrl ? props.map.imageUrl : ''
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [urlPreviewError, setUrlPreviewError] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoke object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  /**
   * Clears the upload state.
   */
  const clearUploadState = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    setUploadError(null)
  }, [previewUrl])

  /**
   * Handles the selection of a file.
   *
   * @param file - The file to select.
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      setUploadError(null)
      if (!isValidImageFile(file)) {
        setUploadError('Please choose a PNG, JPEG, or WebP image.')
        return
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError('Image is too large (max 10 MB).')
        return
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    },
    [previewUrl]
  )

  /**
   * Handles the change of the file input.
   *
   * @param e - The change event.
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFileSelect(f)
      e.target.value = ''
    },
    [handleFileSelect]
  )

  /**
   * Handles the drag over event.
   *
   * @param e - The drag event.
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  /**
   * Handles the drag leave event.
   *
   * @param e - The drag event.
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * Handles the drop event.
   *
   * @param e - The drag event.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = e.dataTransfer.files
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        if (isValidImageFile(f)) {
          handleFileSelect(f)
          return
        }
      }
      if (files.length > 0) {
        setUploadError('Please drop a PNG, JPEG, or WebP image.')
      }
    },
    [handleFileSelect]
  )

  /**
   * Handles the submission of the form.
   *
   * @param e - The form event.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedName = name.trim()
      if (!trimmedName) {
        setError('Enter a name.')
        return
      }
      setError(null)

      if (imageSourceUi === 'url') {
        const urlErr = validateUrl(imageUrlInput)
        if (urlErr) {
          setError(urlErr)
          return
        }
      }

      if (
        imageSourceUi === 'upload' &&
        props.mode === 'create' &&
        !selectedFile
      ) {
        setError('Choose an image file or switch to URL / None.')
        return
      }

      setIsSubmitting(true)
      try {
        const baseMapName = deriveMapNameFromTopLevelPlaceName(trimmedName)

        if (props.mode === 'create') {
          let created = await mapRepository.create({
            gameId: props.gameId,
            name: baseMapName,
            ...(imageSourceUi === 'url'
              ? {
                  imageSourceType: 'url' as const,
                  imageUrl: imageUrlInput.trim(),
                }
              : {}),
          })

          const topLevelPlace = await placeRepository.create({
            gameId: props.gameId,
            name: formatTopLevelPlaceName(baseMapName),
            notes: '',
            map: created.id,
          })

          created = {
            ...created,
            topLevelPlaceId: topLevelPlace.id,
          }
          await mapRepository.update(created)

          if (imageSourceUi === 'upload' && selectedFile) {
            await mapRepository.setImageFromUpload(created.id, selectedFile)
          }
        } else {
          const mapId = props.map.id
          const updatedMap: Map = {
            ...props.map,
            name: baseMapName,
          }
          await mapRepository.update(updatedMap)

          if (updatedMap.topLevelPlaceId) {
            const place = await placeRepository.getById(updatedMap.topLevelPlaceId)
            if (place) {
              await placeRepository.update({
                ...place,
                name: formatTopLevelPlaceName(trimmedName),
              })
            }
          }
          if (imageSourceUi === 'none') {
            await mapRepository.clearImage(mapId)
          } else if (imageSourceUi === 'url') {
            await mapRepository.setImageFromUrl(mapId, imageUrlInput.trim())
          } else if (selectedFile) {
            await mapRepository.setImageFromUpload(mapId, selectedFile)
          }
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save map.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, imageSourceUi, imageUrlInput, selectedFile, props]
  )

  const hasExistingUpload =
    props.mode === 'edit' &&
    props.map.imageSourceType === 'upload' &&
    props.map.imageBlobId

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="map-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="map-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Map label"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'map-form-error' : undefined}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">
          Image source
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="imageSource"
              checked={imageSourceUi === 'none'}
              onChange={() => {
                setImageSourceUi('none')
                clearUploadState()
                setImageUrlInput('')
                setError(null)
                setUploadError(null)
              }}
              disabled={isSubmitting}
              className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700">None</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="imageSource"
              checked={imageSourceUi === 'url'}
              onChange={() => {
                setImageSourceUi('url')
                clearUploadState()
                setUploadError(null)
              }}
              disabled={isSubmitting}
              className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700">URL</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="imageSource"
              checked={imageSourceUi === 'upload'}
              onChange={() => {
                setImageSourceUi('upload')
                setImageUrlInput('')
                setError(null)
              }}
              disabled={isSubmitting}
              className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700">Upload</span>
          </label>
        </div>
      </fieldset>

      {imageSourceUi === 'url' && (
        <div>
          <label
            htmlFor="map-imageUrl"
            className="block text-sm font-medium text-slate-700"
          >
            Image URL
          </label>
          <input
            id="map-imageUrl"
            type="url"
            value={imageUrlInput}
            onChange={(e) => {
              setImageUrlInput(e.target.value)
              setUrlPreviewError(false)
            }}
            placeholder="https://…"
            disabled={isSubmitting}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          />
          {imageUrlInput.trim() && (
            <div className="mt-2 flex items-start gap-2">
              <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50">
                <img
                  src={imageUrlInput.trim()}
                  alt=""
                  className="h-full w-full object-contain"
                  onLoad={() => setUrlPreviewError(false)}
                  onError={() => setUrlPreviewError(true)}
                />
              </div>
              {urlPreviewError && (
                <p className="text-xs text-amber-600">
                  Could not load preview.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {imageSourceUi === 'upload' && (
        <div>
          {hasExistingUpload && !selectedFile && !previewUrl && (
            <p className="mb-2 text-sm text-slate-600">
              Using uploaded image. Choose a new file to replace it.
            </p>
          )}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-4 text-center transition ${
              isDragging
                ? 'border-slate-500 bg-slate-100'
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              aria-label="Choose image file"
            />
            <p className="text-sm text-slate-600">
              Drag an image here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="font-medium text-slate-800 underline hover:text-slate-900 disabled:opacity-50"
              >
                click to browse
              </button>
            </p>
            {(previewUrl || selectedFile) && (
              <div className="mt-3 flex flex-col items-center gap-2">
                {previewUrl && (
                  <div className="h-24 w-32 overflow-hidden rounded border border-slate-200 bg-white">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearUploadState}
                  disabled={isSubmitting}
                  className="text-xs text-slate-600 underline hover:text-slate-800 disabled:opacity-50"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
          {uploadError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {error && (
        <p id="map-form-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving…'
            : props.mode === 'create'
              ? 'Create'
              : 'Save'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={isSubmitting}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
