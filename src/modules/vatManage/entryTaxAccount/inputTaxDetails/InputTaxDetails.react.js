/**
 * author       : liuliyuan
 * createTime   : 2017/12/16 10:48
 * description  :
 */
import React,{Component} from 'react'
import {Layout,Card,Row,Col,Form,Button,Icon,message,Modal} from 'antd'
import {AsyncTable,TableTotal} from 'compoments'
import {request,getFields,fMoney,getUrlParam,listMainResultStatus} from 'utils'
import SubmitOrRecallMutex from 'compoments/buttonModalWithForm/SubmitOrRecallMutex.r'
import PopInvoiceInformationModal from './popModal'
import { withRouter } from 'react-router'
import moment from 'moment';
const buttonStyle={
    marginRight:5
}
class InputTaxDetails extends Component {
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
        params:{},
        statusParam:{},
        dataSource:[],
        totalSource:undefined,
    }

    columns = [
        {
            title: '纳税主体',
            dataIndex: 'mainName',
        }, {
            title: '抵扣凭据类型',
            dataIndex: 'sysDictIdName',
        },{
            title: '凭据份数',
            dataIndex: 'num',
            render:(text,record)=>(
                <a onClick={()=>{
                    const params= {
                        mainId:record.mainId,
                        invoiceType:record.sysDictId,
                    }
                    this.setState({
                        params:params
                    },()=>{
                        this.toggleModalVisible(true)
                    })
                }}>{text}</a>
            )
        },{
            title: '金额',
            dataIndex: 'amount',
            render:text=>fMoney(text),
        },{
            title: '税额',
            dataIndex: 'taxAmount',
            render:text=>fMoney(text),

        }
    ];

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
                                request.put('/account/income/taxDetail/reset',values)
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
                            filters:values,
                        },()=>{
                            this.refreshTable();
                        });
                }
            }
        });
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
            this.updateStatus();
        })
    }
    requestPost=(url,type,data={})=>{
        request.post(url,data)
            .then(({data})=>{
                if(data.code===200){
                    message.success(`${type}成功!`);
                    this.refreshTable();
                }else{
                    message.error(`${type}失败:${data.msg}`)
                }
            })
    }
    updateStatus=()=>{
        request.get('/account/income/taxDetail/listMain',{params:this.state.filters}).then(({data}) => {
            if (data.code === 200) {
                this.setState({
                    statusParam: data.data,
                })
            }
        })
    }
    componentDidMount(){
        const {search} = this.props.location;
        if(!!search){
            this.handleSubmit()
        }
    }
    render(){
        const {tableUpDateKey,filters,visible,params,dataSource,statusParam,totalSource} = this.state;
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
                                        span:6,
                                        componentProps:{
                                            disabled,
                                        },
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
                                        label:'认证月份',
                                        fieldName:'authMonth',
                                        type:'monthPicker',
                                        span:6,
                                        componentProps:{
                                            format:'YYYY-MM',
                                            disabled,
                                        },
                                        fieldDecoratorOptions:{
                                            initialValue: (disabled && (!!search && moment(getUrlParam('authMonth'), 'YYYY-MM'))) || undefined,
                                            rules:[
                                                {
                                                    required:true,
                                                    message:'请选择认证月份'
                                                }
                                            ]
                                        },
                                    },
                                ])
                            }

                            <Col span="6" className="btnAlignCenter"  >
                                <Button style={{marginLeft:20}} size='small' type="primary" htmlType="submit">查询</Button>
                                <Button style={{marginLeft:10}} size='small' onClick={()=>this.props.form.resetFields()}>重置</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <Card
                    extra={
                        <div>
                            {
                                dataSource.length>0 && listMainResultStatus(statusParam)
                            }
                            <Button size="small" style={buttonStyle} disabled={disabled1} onClick={(e)=>this.handleSubmit(e,'提交')}><Icon type="check" />提交</Button>
                            <SubmitOrRecallMutex
                              url="/account/income/taxDetail"
                              refreshTable={this.refreshTable}
                              hasParam={filters.mainId && filters.authMonth}
                              dataStatus={statusParam&&statusParam.status}
                              searchFieldsValues={this.state.filters}
                            />
                            <TableTotal type={3} totalSource={totalSource} data={
                                [
                                    {
                                        title:'合计',
                                        total:[
                                            {title: '金额', dataIndex: 'pageAmount'},
                                            {title: '税额', dataIndex: 'pageTaxAmount'},
                                        ],
                                    }
                                ]
                            } />
                        </div>
                    }
                    style={{marginTop:10}}>

                    <AsyncTable url="/account/income/taxDetail/list"
                                updateKey={tableUpDateKey}
                                filters={filters}
                                tableProps={{
                                    rowKey:record=>record.id,
                                    pagination:true,
                                    size:'small',
                                    columns:this.columns,
                                    onDataChange:(dataSource)=>{
                                        this.setState({
                                            dataSource
                                        })
                                    },
                                    onTotalSource: (totalSource) => {
                                        this.setState({
                                            totalSource
                                        })
                                    },
                                }} />
                </Card>

                <PopInvoiceInformationModal
                    title="发票信息"
                    visible={visible}
                    params={params}
                    filters={filters}
                    toggleModalVisible={this.toggleModalVisible}
                />
            </Layout>
        )
    }
}
export default Form.create()(withRouter(InputTaxDetails))
