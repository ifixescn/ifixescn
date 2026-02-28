import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 捕获React组件树中的JavaScript错误，记录错误并显示降级UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to show fallback UI on next render
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detailed error information to console
    console.error('=== ErrorBoundary caught an error ===');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Current URL:', window.location.href);
    console.error('User Agent:', navigator.userAgent);
    console.error('Timestamp:', new Date().toISOString());
    console.error('====================================');
    
    // Update state to show error details
    this.setState({
      error,
      errorInfo,
    });

    // Can report error logs to server
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">糟糕！出现了一些问题</CardTitle>
              <CardDescription className="text-base">
                很抱歉给您带来不便，应用程序遇到了意外错误。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 错误信息（在所有环境显示简化版本） */}
              {this.state.error && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-sm text-destructive">
                    错误: {this.state.error.toString()}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        堆栈跟踪
                      </summary>
                      <pre className="mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>

              {/* 帮助信息 */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">💡 有用的提示：</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>尝试刷新页面</li>
                  <li>清除浏览器缓存和Cookie</li>
                  <li>如果在微信中，尝试在外部浏览器中打开</li>
                  <li>检查您的网络连接</li>
                  <li>如果问题持续存在，请联系技术支持</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
