-- 创建退费请求日志表
CREATE TABLE REFUND_REQUEST_LOG (
    ID NUMBER(20) PRIMARY KEY,
    ID_VISMED VARCHAR2(32) NOT NULL,
    REQUEST_TIME TIMESTAMP DEFAULT SYSTIMESTAMP,
    IP_ADDRESS VARCHAR2(50),
    OPERATOR VARCHAR2(50),
    OPERATE_TIME TIMESTAMP DEFAULT SYSTIMESTAMP,
    REQUEST_RESULT VARCHAR2(10),
    REQUEST_CONTENT CLOB,
    RESPONSE_CONTENT CLOB,
    ERROR_MESSAGE VARCHAR2(500),
    CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- 创建序列用于生成主键
CREATE SEQUENCE REFUND_LOG_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- 创建触发器自动生成主键
CREATE OR REPLACE TRIGGER REFUND_LOG_TRG
BEFORE INSERT ON REFUND_REQUEST_LOG
FOR EACH ROW
BEGIN
    SELECT REFUND_LOG_SEQ.NEXTVAL INTO :NEW.ID FROM DUAL;
END;
/

-- 添加注释
COMMENT ON TABLE REFUND_REQUEST_LOG IS '退费请求日志表';
COMMENT ON COLUMN REFUND_REQUEST_LOG.ID IS '主键ID';
COMMENT ON COLUMN REFUND_REQUEST_LOG.ID_VISMED IS '就诊ID';
COMMENT ON COLUMN REFUND_REQUEST_LOG.REQUEST_TIME IS '请求时间';
COMMENT ON COLUMN REFUND_REQUEST_LOG.IP_ADDRESS IS 'IP地址';
COMMENT ON COLUMN REFUND_REQUEST_LOG.OPERATOR IS '操作员';
COMMENT ON COLUMN REFUND_REQUEST_LOG.OPERATE_TIME IS '操作时间';
COMMENT ON COLUMN REFUND_REQUEST_LOG.REQUEST_RESULT IS '请求结果(SUCCESS/FAIL)';
COMMENT ON COLUMN REFUND_REQUEST_LOG.REQUEST_CONTENT IS '请求内容';
COMMENT ON COLUMN REFUND_REQUEST_LOG.RESPONSE_CONTENT IS '响应内容';
COMMENT ON COLUMN REFUND_REQUEST_LOG.ERROR_MESSAGE IS '错误信息';
COMMENT ON COLUMN REFUND_REQUEST_LOG.CREATED_AT IS '创建时间'; 