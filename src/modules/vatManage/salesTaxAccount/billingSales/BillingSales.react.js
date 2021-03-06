/**
 * author       : liuliyuan
 * createTime   : 2017/12/14 12:10
 * description  :
 */
import React,{Component} from 'react'
import {Layout,Card,Row,Col,Form,Button,message,Icon,Modal} from 'antd'
import {FileExport,SynchronizeTable} from 'compoments'
import {getFields,fMoney,request,getUrlParam,listMainResultStatus} from 'utils'
import PopInvoiceInformationModal from './popModal'
import { withRouter } from 'react-router'
import SubmitOrRecallMutex from 'compoments/buttonModalWithForm/SubmitOrRecallMutex.r'
import moment from 'moment';

const formItemStyle = {
    labelCol:{
        sm:{
            span:10,
        },
        xl:{
            span:8
        }
    },
    wrapperCol:{
        sm:{
            span:14
        },
        xl:{
            span:16
        }
    }
}
const columns = context => [
    {
        title: '项目',
        dataIndex: 'taxMethod',
    }, {
        title: '栏次',
        dataIndex: 'name',
    },{
        title: '开具增值税专用发票',
        children: [
            {
                title: '数量',
                dataIndex: 'specialInvoiceCount',
                render:(text,record)=>(
                    parseInt(text, 0) === 0 ? text  : <a onClick={()=>{
                        context.setState({
                            sysTaxRateId:record.sysTaxRateId,
                            invoiceType:'s',
                        },()=>{
                            context.toggleModalVisible(true)
                        })
                    }}>{text}</a>
                )
            },{
                title: '销售额',
                dataIndex: 'specialInvoiceAmount',
                render:text=>fMoney(text),
            },{
                title: '销项（应纳）税额 ',
                dataIndex: 'specialInvoiceTaxAmount',
                render:text=>fMoney(text),
            }
        ]
    },{
        title: '开具其他发票',
        children: [
            {
                title: '数量',
                dataIndex: 'otherInvoiceCount',
                render:(text,record)=>(
                    parseInt(text, 0) === 0 ? text : <a onClick={()=>{
                        context.setState({
                            sysTaxRateId:record.sysTaxRateId,
                            invoiceType:'c',
                        },()=>{
                            context.toggleModalVisible(true)
                        })
                    }}>{text}</a>
                )
            },{
                title: '销售额',
                dataIndex: 'otherInvoiceAmount',
                render:text=>fMoney(text),
            },{
                title: '销项（应纳）税额 ',
                dataIndex: 'otherInvoiceTaxAmount',
                render:text=>fMoney(text),
            }
        ]
    }
];

const notColumns = context =>[
    {
        title: '项目',
        dataIndex: 'taxMethod',
        render: (text, row, index) => {
            const obj = {
                children: text,
                props: {},
            };
            if (index === 0) {
                obj.props.rowSpan = 6;
            }
            if (index === 6) {
                obj.props.rowSpan = 4;
            }
            if (index === 10) {
                obj.props.rowSpan = 1;
            }
            // These two are merged into above cell
            if (index === 1 || index === 2 || index === 3 || index === 4 || index === 5 || index === 7 || index === 8 || index === 9  || index === 11 ) {
                obj.props.rowSpan = 0;
            }
            return obj;
        }
    }, {
        title: '栏次',
        dataIndex: 'name',
    },{
        title: '开具增值税专用发票',
        children: [
            {
                title: '数量',
                dataIndex: 'specialInvoiceCount',
                render:(text,record)=>(
                    parseInt(text, 0) === 0 ? text : <a onClick={()=>{
                        context.setState({
                            sysTaxRateId:record.sysTaxRateId,
                            invoiceType:'s',
                        },()=>{
                            context.toggleModalVisible(true)
                        })
                    }}>{text}</a>
                )
            },{
                title: '销售额',
                dataIndex: 'specialInvoiceAmount',
                render:text=>fMoney(text),
            },{
                title: '销项（应纳）税额 ',
                dataIndex: 'specialInvoiceTaxAmount',
                render:text=>fMoney(text),
            }
        ]
    },{
        title: '开具其他发票',
        children: [
            {
                title: '数量',
                dataIndex: 'otherInvoiceCount',
                render:(text,record)=>(
                    parseInt(text, 0) === 0 ? text : <a onClick={()=>{
                        context.setState({
                            sysTaxRateId:record.sysTaxRateId,
                            invoiceType:'c',
                        },()=>{
                            context.toggleModalVisible(true)
                        })
                    }}>{text}</a>
                )
            },{
                title: '销售额',
                dataIndex: 'otherInvoiceAmount',
                render:text=>fMoney(text),
            },{
                title: '销项（应纳）税额 ',
                dataIndex: 'otherInvoiceTaxAmount',
                render:text=>fMoney(text),
            }
        ]
    }
];
class BillingSales extends Component {
    state={
        /**
         * params条件，给table用的
         * */
        filters:{
            pageSize:20
        },

        /**
         * 控制table刷新，要让table刷新，只要给这个值设置成新值即可
         * */
        tableUpDateKey:Date.now(),
        visible:false,
        loaded:true,
        sysTaxRateId:undefined,
        invoiceType:undefined,
        statusParam:{},
        dataSource:[],
        notDataSource:[],
    }
    toggleModalVisible=visible=>{
        this.setState({
            visible
        })
    }
    refreshTable = ()=>{
        this.setState({
            tableUpDateKey:Date.now()
        },()=>{
            this.fetch()
        })
    }
    handleSubmit = (e,type) => {
        e && e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                if(values.authMonth){
                    values.authMonth = values.authMonth.format('YYYY-MM')
                }
                switch (type){

                    case '重算':
                        Modal.confirm({
                            title: '友情提醒',
                            content: '确定要重算吗',
                            onOk : ()=> {
                                request.put('/account/output/billingSale/reset',values)
                                    .then(({data})=>{
                                        if(data.code===200){
                                            message.success(`${type}成功!`);
                                            this.refreshTable();
                                        }else{
                                            message.error(`${type}失败:${data.msg}`)
                                        }
                                    })
                            }
                        })
                        break;
                    default:
                        this.setState({
                            filters:values
                        },()=>{
                            this.refreshTable();
                        });
                }
            }
        });
    }

    fetch=()=>{
        this.setState({ loaded: false });
        request.get('/account/output/billingSale/list',{
            params:this.state.filters
        }).then(({data}) => {
            if(data.code===200){
                this.setState({
                    dataSource: data.data.records,
                    notDataSource: data.data.notRecords,
                    loaded: true,
                },()=>{
                    this.updateStatus()
                });
            }else{
                message.error(data.msg)
                this.setState({
                    loaded: true
                });
            }
        }).catch(err=>{
            this.setState({
                loaded: true
            });
        });

    }

    requestPost=(url,type,value={})=>{
        request.post(url,value)
            .then(({data})=>{
                if(data.code===200){
                    message.success(`${type}成功!`);
                    this.refreshTable();
                    //this.props.form.resetFields()
                }else{
                    message.error(`${type}失败:${data.msg}`)
                }
            })
    }
    updateStatus=()=>{
        request.get('/account/output/billingSale/listMain',{params:this.state.filters}).then(({data}) => {
            if (data.code === 200) {
                this.setState({
                    statusParam: data.data
                })
            }
        })
    }
    componentDidMount(){
        const {search} = this.props.location;
        if(!!search){
            this.handleSubmit();
        }
    }
    render(){
        const {tableUpDateKey,filters,dataSource,notDataSource,visible,sysTaxRateId,invoiceType,statusParam,loaded} = this.state;
        const disabled1 = !((filters.mainId && filters.authMonth) && (statusParam && parseInt(statusParam.status, 0) === 1));
        const {search} = this.props.location;
        let disabled = !!search;
        return(
            <Layout style={{background:'transparent'}} >
                <Card
                    style={{
                        borderTop:'none'
                    }}
                    className="search-card"
                >
                    <Form onSubmit={this.handleSubmit}>
                        <Row>
                            {
                                getFields(this.props.form,[
                                    {
                                        label:'纳税主体',
                                        fieldName:'mainId',
                                        type:'taxMain',
                                        span:"6",
                                        componentProps:{
                                            disabled:disabled
                                        },
                                        formItemStyle,
                                        fieldDecoratorOptions:{
                                            initialValue: (disabled && getUrlParam('mainId')) || undefined,
                                            rules:[
                                                {
                                                    required:true,
                                                    message:'请选择纳税主体'
                                                }
                                            ]
                                        },
                                    },{
                                        label:'查询期间',
                                        fieldName:'authMonth',
                                        type:'monthPicker',
                                        span:"6",
                                        componentProps:{
                                            format:'YYYY-MM',
                                            disabled:disabled
                                        },
                                        formItemStyle,
                                        fieldDecoratorOptions:{
                                            initialValue: (disabled && moment(getUrlParam('authMonth'), 'YYYY-MM')) || undefined,
                                            rules:[
                                                {
                                                    required:true,
                                                    message:'请选择查询期间'
                                                }
                                            ]
                                        },
                                    },
                                ])
                            }

                            <Col span={12} style={{textAlign:'right'}}>
                                <Form.Item>
                                <Button style={{marginLeft:20}} size='small' type="primary" htmlType="submit">查询</Button>
                                <Button style={{marginLeft:10}} size='small' onClick={()=>this.props.form.resetFields()}>重置</Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <Card title="开票销售统计表-房地产"
                      extra={<div>
                          {
                              dataSource.length>0 && listMainResultStatus(statusParam)
                          }
                          <FileExport
                              url={`account/output/billingSale/export`}
                              title='导出'
                              setButtonStyle={{marginRight:5}}
                              disabled={disabled1 || !dataSource.length>0}
                              params={{
                                  isEstate:1,
                                  ...filters
                              }}
                          />
                          <Button
                              size='small'
                              style={{marginRight:5}}
                              disabled={disabled1}
                              onClick={(e)=>this.handleSubmit(e,'重算')}>
                              <Icon type="retweet" />
                              重算
                          </Button>


                          <SubmitOrRecallMutex
                            url="/account/output/billingSale"
                            refreshTable={this.refreshTable}
                            hasParam={filters.mainId && filters.authMonth}
                            dataStatus={statusParam&&statusParam.status}
                            searchFieldsValues={this.state.filters}
                          />

                      </div>
                      }
                      style={{marginTop:10}}>

                    <SynchronizeTable
                        data={dataSource}
                        updateKey={tableUpDateKey}
                        loaded={loaded}
                        tableProps={{
                            rowKey:record=>record.sysTaxRateId,
                            pagination:false,
                            size:'small',
                            columns:columns(this),
                        }} />

                </Card>
                <Card title="开票销售统计表-非地产"
                      extra={<div>
                                <FileExport
                                    url={`account/output/billingSale/export`}
                                    title='导出'
                                    setButtonStyle={{marginRight:5}}
                                    disabled={disabled1 || !(notDataSource && notDataSource.length>0)}
                                    params={{
                                        isEstate:0,
                                        ...filters
                                    }}
                                />
                            </div>}
                      style={{marginTop:10}}>

                      <SynchronizeTable
                            data={notDataSource}
                            updateKey={tableUpDateKey}
                            loaded={loaded}
                            tableProps={{
                                rowKey:record=>record.sysTaxRateId,
                                pagination:false,
                                size:'small',
                                columns:notColumns(this),
                            }} />
                </Card>

                <PopInvoiceInformationModal
                    title="发票信息"
                    visible={visible}
                    filters={{
                        ...filters,
                        invoiceType,
                        taxRateId:sysTaxRateId
                    }}
                    toggleModalVisible={this.toggleModalVisible}
                />
            </Layout>
        )
    }
}
export default Form.create()(withRouter(BillingSales))
