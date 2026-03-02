/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { Toast } from 'antd-mobile';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 业务错误码映射表 (参考 API 文档)
const ERROR_MESSAGES: Record<number, string> = {
  40001: '请输入内容',
  40002: '字数超限',
  40003: '图片不符合要求',
  40901: '重复提交',
  42901: '操作太频繁',
  45101: '内容包含敏感信息',
  45102: '回答包含敏感信息',
  50001: '服务异常',
  50002: '思考超时，请重试',
};

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data;

    if (code === 0) {
      return data;
    } else {
      // 业务错误处理
      const errorMsg = ERROR_MESSAGES[code] || message || '未知错误';
      Toast.show({
        content: errorMsg,
        icon: 'fail',
      });
      return Promise.reject(new Error(errorMsg));
    }
  },
  (error: AxiosError) => {
    // HTTP 错误处理
    let message = '网络请求失败';
    if (error.response) {
      const status = error.response.status;
      if (status === 404) message = '接口不存在';
      else if (status === 500) message = '服务器错误';
      else if (status === 403) message = '无权访问';
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时';
    }

    Toast.show({
      content: message,
      icon: 'fail',
    });
    return Promise.reject(error);
  }
);

export default request;
