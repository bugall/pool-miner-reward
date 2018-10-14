## 基于stratum协议实现的矿池代码

### Feature
#### 1. 对woker, reward两个模块通过消息队列进行简单的查分, 此项目是reward部分(代码持续完善)
- 消息队列暂时使用阿里云mns服务

### Build
- gcc 建议 5.x.x 版本, 因为npm包中有些c的std标准不同, 为了方便部署建议在docker中创建(近期会提供Dockerfile)
