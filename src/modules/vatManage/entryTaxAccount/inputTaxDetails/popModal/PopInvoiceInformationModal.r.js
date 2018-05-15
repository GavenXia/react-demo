/**
 * author       : liuliyuan
 * createTime   : 2018/1/10 14:39
 * description  :
 */
import React,{Component} from 'react'
import {Card,Row,Col,Form,Button,Modal } from 'antd'
import {AsyncTable} from 'compoments'
import {getFields,fMoney} from 'utils'
class PopInvoiceInformationModal extends Component{
    static defaultProps={
        visible:true,
    }

    state={
        /**
         * params条件，给table用的
         * */
        filters:{},
        /**
         * 控制table刷新，要让table刷新，只要给这个值设置成新值即可
         * */
        tableUpDateKey:Date.now(),
    }

    columns = [
        {
            title: '数据来源',
            dataIndex: 'sourceType',
            width:100,
            render:text=>{
                text = parseInt(text,0)
                if(text===1){
                    return '手工采集'
                }
                if(text===2){
                    return '外部导入'
                }
                return ''
            },
        },{
            title: '纳税主体',
            dataIndex: 'mainName',
            width:120,
        }, {
            title:['发票类型','发票代码','发票号码'],
            dataIndex:['invoiceType','invoiceCode','invoiceNum'],
            width:150,
            render:(text,record)=>{
                let invoiceType='-'
                if(record.invoiceType==='s'){
                    invoiceType = '专票'
                }
                if(record.invoiceType==='c'){
                    invoiceType = '普票'
                }
                return <div>
                         <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{invoiceType}</p>
                         <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.invoiceCode}</p>
                         <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.invoiceNum}</p>
                        </div>;
            }
        },{
            title: '开票日期',
            dataIndex: 'billingDate',
            width:100,
            className:'text-center'
        },
        // {
        //     title: '认证月份',
        //     dataIndex: 'authMonth',
        //     width:70,
        // },
        {
            title: '认证时间',
            dataIndex: 'authDate',
            width:100,
            className:'text-center'
        },{
            title: ['销售单位名称','纳税人识别号'],
            dataIndex: ['sellerName','sellerTaxNum'],
            width:200,
        },{
            title:['价税合计','金额','税额'],
            dataIndex:['totalAmount','amount','taxAmount'],
            width:150,
            render:(text,record)=><div className='table-money'>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{fMoney(record.totalAmount)}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.amount)}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.taxAmount)}</p>
                   </div>

        }
    ];

    handleSubmit = e => {
        e && e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.setState({
                    filters:values
                },()=>{
                    this.setState({
                        tableUpDateKey:Date.now()
                    })
                });
            }
        });
    }
    handleReset = () => {
        this.props.form.resetFields();
        this.props.toggleModalVisible(false)
    }
    refreshTable = ()=>{
        this.setState({
            tableUpDateKey:Date.now()
        })
    }

    componentWillReceiveProps(nextProps){
        if(!nextProps.visible){
            /**
             * 关闭的时候清空表单
             * */
            nextProps.form.resetFields();
        }
        if(!this.props.visible && nextProps.visible){
            //TODO: Modal在第一次弹出的时候不会被初始化，所以需要延迟加载
            setTimeout(()=>{
                this.refreshTable()
            },200)
        }
    }
    render(){
        const {tableUpDateKey,filters } = this.state;
        const props = this.props;
        return(
            <Modal
                maskClosable={false}
                destroyOnClose={true}
                onCancel={()=>props.toggleModalVisible(false)}
                width={900}
                style={{ top: 50 ,maxWidth:'80%'}}
                visible={props.visible}
                footer={
                    <Row>
                        <Col span={12}></Col>
                        <Col span={12}>
                            <Button onClick={this.handleReset}>取消</Button>
                        </Col>
                    </Row>
                }
                title={props.title}>
                <Card
                    style={{
                        border:'none'
                    }}
                    className="search-card"
                >
                    <Form onSubmit={this.handleSubmit}>
                        <Row>
                            {
                                getFields(this.props.form,[
                                    {
                                        label:'发票号码',
                                        fieldName:'invoiceNum',
                                        type:'input',
                                        span:8,
                                        componentProps:{
                                        }
                                    },
                                ])
                            }

                            <Col className="btnAlignCenter" style={{width:"100%",textAlign:"right"}}>
                                <Button size="small" style={{marginTop:3,marginLeft:20}} type="primary" htmlType="submit">查询</Button>
                                <Button size="small" style={{marginTop:3,marginLeft:10}} onClick={()=>this.props.form.resetFields()}>重置</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                {/*extra={<div>
                <FileExport
                    url='income/invoice/marry/download'
                    title="导出"
                    size="small"
                    setButtonStyle={{marginRight:5}}
                />
            </div>}*/}
                {/* <Card  style={{marginTop:10}}>
                </Card> */}

                <AsyncTable url={'/income/invoice/collection/list'}
                            updateKey={tableUpDateKey}
                            filters={{
                                ...props.params,
                                authMonthStart:props.filters.authMonth,
                                authMonthEnd:props.filters.authMonth,
                                ...filters
                            }}
                            tableProps={{
                                rowKey:record=>record.id,
                                pagination:true,
                                size:'small',
                                columns:this.columns,
                                scroll:{ x: '100%',y:350},
                                renderFooter:data=>{
                                    return (
                                        <div className="footer-total">
                                            <div className="footer-total-meta">
                                                <div className="footer-total-meta-title">
                                                    <label>本页合计：</label>
                                                </div>
                                                <div className="footer-total-meta-detail">
                                                    本页金额：<span className="amount-code">{fMoney(data.pageAmount)}</span>
                                                    本页税额：<span className="amount-code">{fMoney(data.pageTaxAmount)}</span>
                                                    本页价税：<span className="amount-code">{fMoney(data.pageTotalAmount)}</span>
                                                </div>
                                                <div className="footer-total-meta-title">
                                                    <label>总计：</label>
                                                </div>
                                                <div className="footer-total-meta-detail">
                                                    总金额：<span className="amount-code">{fMoney(data.allAmount)}</span>
                                                    总税额：<span className="amount-code">{fMoney(data.allTaxAmount)}</span>
                                                    总价税：<span className="amount-code">{fMoney(data.allTotalAmount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                },
                            }} />

            </Modal>
        )
    }
}
export default Form.create()(PopInvoiceInformationModal)
