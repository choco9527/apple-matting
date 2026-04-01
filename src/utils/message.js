import { ElNotification } from 'element-plus';
import 'element-plus/theme-chalk/el-notification.css'

const message = {
  success(message, title = '') {
    ElNotification({
      title,
      message,
      type: 'success',
      duration: 2000,
    })
  },

  warning(message, title = '') {
    ElNotification({
      title,
      message,
      type: 'warning',
      duration: 2000,
    })
  },

  error(message, title = '') {
    ElNotification({
      title,
      message,
      type: 'error',
      duration: 2000,
    })
  },

  info(message, title = '') {
    ElNotification({
      title,
      message,
      type: 'info',
      duration: 2000,
    })
  }
}

export default message