export default {
    common: {
        confirm: '确定',
        cancel: '取消',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        loading: '加载中...',
        success: '成功',
        fail: '失败'
    },
    header: {
        title: 'Apple Matting',
        subTitle: '智能抠图',
        lingxiangTools: '灵象工具箱',
        theme: {
            light: '明亮模式',
            dark: '深色模式',
            auto: '跟随系统'
        }
    },
    about: {
        title: '关于',
        author: '作者',
        email: '联系邮箱',
        website: '网站',
        version: '版本',
        checkUpdate: '检查更新',
        checkUpdateLink: '点击检查更新',
        copyright: '版权所有：由灵象工具箱赞助开发',
        sponsor: '赞助',
        sponsorPlaceholder: '赞助二维码（待提供）',
        wechat: '公众号',
        wechatPlaceholder: '公众号二维码（待提供）'
    },
    sidebar: {
        menu: {
            single: '单张处理',
            batch: '批量处理'
        }
    },
    batch: {
        title: '批量抠图说明',
        description: '选择一个包含图片的文件夹，系统将自动找出所有支持的图片（JPG/PNG/WEBP/BMP）并进行批量处理。处理过程可随时暂停。瀑布流预览支持下拉加载。',
        selectInput: '点击选择输入文件夹',
        selectInputHint: '支持包含子文件夹的嵌套目录',
        inputDir: '输入目录：',
        reselect: '重新选择',
        outputDir: '存储路径：',
        outputDirHint: '留空则默认保存在输入目录下的 Apple-Matting-Result 中',
        selectPath: '选择路径',
        total: '总计',
        pending: '待处理',
        success: '成功',
        fail: '失败',
        start: '开始处理',
        pause: '暂停处理',
        complete: '全部完成',
        previewStatus: '处理状态',
        previewPath: '文件路径',
        previewImg: '图片预览',
        loadMore: '下拉加载更多...',
        noMore: '到底啦',
        emptyList: '未找到支持的图片文件',
        scanning: '正在扫描文件夹...',
        openOriginal: '打开原图所在位置',
        openResult: '打开结果图所在位置',
        errorOpen: '打开位置失败',
        errorScan: '扫描文件夹失败',
        warnPause: '请先暂停或等待处理完成',
        status: {
            pending: '待处理',
            processing: '处理中',
            success: '已完成',
            fail: '失败',
            unknown: '未知'
        }
    },
    single: {
        uploadTitle: '点击 / 拖拽 / Ctrl+V 粘贴图片',
        uploadHint: '支持 JPG、PNG、WEBP、BMP 格式',
        demoTitle: '或试试示例图片',
        previewTitle: '图片预览',
        compareTitle: '效果对比',
        reselect: '重新选择',
        startMatting: '开始抠图',
        matting: '抠图中…',
        editResult: '编辑结果',
        setBg: '设置背景',
        baseColor: '基础色',
        gradientColor: '渐变色',
        copyClipboard: '复制到粘贴板',
        saveResult: '保存结果',
        processing: '处理中，请稍候…',
        errorLoad: '加载示例图失败',
        errorPaste: '粘贴失败',
        errorOpen: '打开文件失败',
        errorMattingUnk: '抠图失败，未知错误',
        errorMatting: '抠图出错',
        errorCopy: '复制失败',
        errorSave: '保存失败',
        supportFormat: '仅支持 JPG、PNG、WEBP、BMP 格式！',
        successCopy: '已复制到粘贴板',
        successSave: '保存成功！'
    },
    imageEditor: {
        toolbar: {
            undo: '撤销 (Ctrl+Z)',
            redo: '重做 (Ctrl+Shift+Z)',
            zoomIn: '放大 (+)',
            zoomOut: '缩小 (-)',
            resetZoom: '重置缩放 (R)',
            move: '移动 (M)',
            erase: '擦除 (E)',
            restore: '还原 (T)',
            complete: '完成 (Enter)',
            setBackground: '设置背景色'
        },
        background: {
            baseColor: '基础色',
            gradientColor: '渐变色',
            customColor: '自定义颜色：'
        },
        shortcuts: {
            title: '快捷键说明:',
            undo: 'Ctrl+Z: 撤销',
            redo: 'Ctrl+Shift+Z: 重做',
            zoom: '+/-: 放大/缩小',
            reset: 'R: 重置缩放',
            move: 'M: 移动模式',
            erase: 'E: 擦除模式',
            restore: 'T: 还原模式',
            complete: 'Enter: 完成',
            brushSize: '[/]: 调整画笔大小'
        }
    }
}
