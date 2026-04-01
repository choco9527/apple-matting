export default {
    common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',
        success: 'Success',
        fail: 'Fail'
    },
    header: {
        title: 'Apple Matting',
        subTitle: 'Smart Background Removal',
        lingxiangTools: 'Lingxiang Toolbox',
        theme: {
            light: 'Light Mode',
            dark: 'Dark Mode',
            auto: 'System Auto'
        }
    },
    about: {
        title: 'About',
        author: 'Author',
        email: 'Contact Email',
        website: 'Website',
        version: 'Version',
        checkUpdate: 'Check Update',
        checkUpdateLink: 'Click to check update',
        copyright: 'Copyright: Sponsored by Lingxiang Toolbox',
        sponsor: 'Sponsor',
        sponsorPlaceholder: 'Sponsor QR Code (Coming Soon)',
        wechat: 'WeChat Official Account',
        wechatPlaceholder: 'WeChat QR Code (Coming Soon)'
    },
    sidebar: {
        menu: {
            single: 'Single Image',
            batch: 'Batch Replace'
        }
    },
    batch: {
        title: 'Batch Matting Instructions',
        description: 'Select a folder containing images. The system will automatically find all supported images (JPG/PNG/WEBP/BMP) and process them in bulk. Processing can be paused at any time. Waterfall preview supports pull-to-load.',
        selectInput: 'Click to select input folder',
        selectInputHint: 'Supports nested directories including subfolders',
        inputDir: 'Input Directory:',
        reselect: 'Reselect',
        outputDir: 'Storage Path:',
        outputDirHint: 'Leave empty to default save in Apple-Matting-Result under the input dir',
        selectPath: 'Select Path',
        total: 'Total',
        pending: 'Pending',
        success: 'Success',
        fail: 'Fail',
        start: 'Start Processing',
        pause: 'Pause Processing',
        complete: 'All Done',
        previewStatus: 'Status',
        previewPath: 'File Path',
        previewImg: 'Preview',
        loadMore: 'Pull to load more...',
        noMore: 'No more items',
        emptyList: 'No supported image files found',
        scanning: 'Scanning folder...',
        openOriginal: 'Open original image location',
        openResult: 'Open result image location',
        errorOpen: 'Failed to open location',
        errorScan: 'Failed to scan folder',
        warnPause: 'Please pause or wait for processing to complete',
        status: {
            pending: 'Pending',
            processing: 'Processing',
            success: 'Done',
            fail: 'Fail',
            unknown: 'Unknown'
        }
    },
    single: {
        uploadTitle: 'Click / Drag / Ctrl+V to paste image',
        uploadHint: 'Supports JPG, PNG, WEBP, BMP',
        demoTitle: 'Or try demo images',
        previewTitle: 'Preview',
        compareTitle: 'Compare',
        reselect: 'Reselect',
        startMatting: 'Start',
        matting: 'Processing...',
        editResult: 'Edit',
        setBg: 'Set Background',
        baseColor: 'Solid',
        gradientColor: 'Gradient',
        copyClipboard: 'Copy to Clipboard',
        saveResult: 'Save',
        processing: 'Processing, please wait...',
        errorLoad: 'Failed to load demo image',
        errorPaste: 'Failed to paste',
        errorOpen: 'Failed to open file',
        errorMattingUnk: 'Matting failed, unknown error',
        errorMatting: 'Error during matting',
        errorCopy: 'Failed to copy',
        errorSave: 'Failed to save',
        supportFormat: 'Only JPG, PNG, WEBP, BMP formats are supported!',
        successCopy: 'Copied to clipboard',
        successSave: 'Saved successfully!'
    },
    imageEditor: {
        toolbar: {
            undo: 'Undo (Ctrl+Z)',
            redo: 'Redo (Ctrl+Shift+Z)',
            zoomIn: 'Zoom In (+)',
            zoomOut: 'Zoom Out (-)',
            resetZoom: 'Reset Zoom (R)',
            move: 'Move (M)',
            erase: 'Erase (E)',
            restore: 'Restore (T)',
            complete: 'Complete (Enter)',
            setBackground: 'Set Background'
        },
        background: {
            baseColor: 'Solid',
            gradientColor: 'Gradient',
            customColor: 'Custom Color:'
        },
        shortcuts: {
            title: 'Keyboard Shortcuts:',
            undo: 'Ctrl+Z: Undo',
            redo: 'Ctrl+Shift+Z: Redo',
            zoom: '+/-: Zoom In/Out',
            reset: 'R: Reset Zoom',
            move: 'M: Move Mode',
            erase: 'E: Erase Mode',
            restore: 'T: Restore Mode',
            complete: 'Enter: Complete',
            brushSize: '[/]: Adjust Brush Size'
        }
    }
}
