/**
 * author       : liuliyuan
 * createTime   : 2018/2/1 16:51
 * description  :
 */
import React,{Component} from 'react';
import PropTypes from 'prop-types'
import {Layout,Card,Row,Col,Form,Button,Spin} from 'antd'
import moment from 'moment'
import {AsyncTable} from 'compoments'
import {getFields} from 'utils'
import TreeList from './TreeList.r'

class TreeTable extends Component{
    static propTypes = {
        searchOption:PropTypes.object,
        cardTableOption:PropTypes.object,
        treeCardOption:PropTypes.object,
        treeOption:PropTypes.object,
        tableOption:PropTypes.object,
        spinning:PropTypes.bool,
        doNotFetchDidMount:PropTypes.bool,
        backCondition:PropTypes.func,// 返回查询条件,
        beforeSearch:PropTypes.func,
    }
    static defaultProps = {
        spinning:false,
        doNotFetchDidMount:false,
        searchOption:{}
    }
    constructor(props){
        super(props)
        this.state={
            /**
             * params条件，给table用的
             * */
            filters:{
            },

            /**
             * 控制table刷新，要让table刷新，只要给这个值设置成新值即可
             * */
            tableUpDateKey:props.tableOption.key || Date.now(),
            visible:false,
            expand:true
        }
    }
    componentWillReceiveProps(nextProps){

        if(this.props.tableOption.key !== nextProps.tableOption.key){
            /*this.setState({
                tableUpDateKey:nextProps.tableOption.key,
            })*/
            this.handleSubmit()
        }

        if(nextProps.searchOption){
            for(let key in nextProps.searchOption.filters){
                if(nextProps.searchOption.filters[key] !== this.props.searchOption.filters[key]){
                    this.setState({
                        filters:nextProps.searchOption.filters
                    })
                }
            }
        }
    }
    handleSubmit = e => {
        e && e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                for(let key in values){
                    if(Array.isArray( values[key] ) && values[key].length === 2 && moment.isMoment(values[key][0])){
                        //当元素为数组&&长度为2&&是moment对象,那么可以断定其是一个rangePicker
                        values[`${key}Start`] = values[key][0].format('YYYY-MM-DD');
                        values[`${key}End`] = values[key][1].format('YYYY-MM-DD');
                        values[key] = undefined;
                    }
                    if(moment.isMoment(values[key])){
                        //格式化一下时间 YYYY-MM类型
                        if(moment(values[key].format('YYYY-MM'),'YYYY-MM',true).isValid()){
                            values[key] = values[key].format('YYYY-MM');
                        }

                        /*if(moment(values[key].format('YYYY-MM-DD'),'YYYY-MM-DD',true).isValid()){
                            values[key] = values[key].format('YYYY-MM-DD');
                        }*/
                    }
                }
                this.setState(prevState=>({
                    selectedRowKeys:null,
                    filters:{
                        ...prevState.filters,
                        ...values
                    }
                }),()=>{
                    this.setState({
                        tableUpDateKey:Date.now(),
                    })
                });

                // 把查询条件返回回去
                //this.props.backCondition && this.props.backCondition(values)
            }
        });

    }
    updateTable=()=>{
        this.handleSubmit()
    }
    componentDidMount(){
        !this.props.doNotFetchDidMount && this.updateTable()
        this.props.searchOption && this.props.searchOption.filters && this.setState({
            filters:this.props.searchOption.filters
        })
    }
    render() {
        const {tableUpDateKey,filters,expand} = this.state;
        const {searchOption,cardTableOption,treeCardOption,treeOption,tableOption,children,form,spinning,style} = this.props;
        return(
            <Layout style={{background:'transparent',...style}} >
                <Spin spinning={spinning}>
                    {
                        searchOption && (
                            <Card
                                className="search-card"
                                bodyStyle={{
                                    padding:expand?'12px 16px':'0 16px'
                                }}
                                /*extra={
                                 <Icon
                                 style={{fontSize:24,color:'#ccc',cursor:'pointer'}}
                                 onClick={()=>{this.setState(prevState=>({expand:!prevState.expand}))}}
                                 type={`${expand?'up':'down'}-circle-o`} />
                                 }*/
                                {...searchOption.cardProps}
                            >
                                <Form style={{display:expand?'block':'none'}}>
                                    <Row>
                                        {
                                            getFields(form,searchOption.fields)
                                        }
                                        <Col className="btnAlignCenter" span="6">
                                            {/* onSubmit={this.handleSubmit} htmlType="submit" */}
                                            <Button size='small' style={{marginTop:5,marginLeft:20}} type="primary"
                                                    onClick={()=>{
                                                        this.handleSubmit()
                                                        this.props.refreshTree();
                                                    }}
                                            >查询</Button>
                                            <Button size='small' style={{marginTop:5,marginLeft:10}} onClick={()=>{
                                                form.resetFields()
                                                this.setState({
                                                    filters : { }
                                                })
                                                //this.props.refreshTree();
                                                searchOption.onResetFields && searchOption.onResetFields();

                                                //手动触发一下是因为使用resetFields()不会触发form的onValuesChange
                                                searchOption.getFieldsValues && searchOption.getFieldsValues({})
                                                searchOption.onFieldsChange && searchOption.onFieldsChange({})
                                            }}>重置</Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>
                        )
                    }

                    <Card
                        extra={cardTableOption.extra || null}
                        style={{marginTop:10}}
                        {...cardTableOption.cardProps}
                    >
                        <Row gutter={24}>
                            <Col span={6}>
                                <Card
                                    extra={treeCardOption.extra || null}
                                    //style={{marginTop:10}}
                                    {...treeCardOption.cardProps}
                                >
                                    <TreeList
                                        url={treeOption.url}
                                        showLine={treeOption.showLine}
                                        updateKey={treeOption.key}
                                        id={filters.id || 0}
                                        treeOption={{
                                            isLoadDate:treeOption.isLoadDate || true,
                                            onSuccess:treeOption.onSuccess || undefined,
                                        }}

                                    />
                                </Card>
                            </Col>
                            <Col span={18}>
                                <Card
                                    extra={tableOption.extra || null}
                                    //style={{marginTop:10}}
                                    {...tableOption.cardProps}
                                >
                                    <AsyncTable url={tableOption.url}
                                                updateKey={tableUpDateKey}
                                                filters={filters}
                                                tableProps={{
                                                    rowKey:record=>record.id,
                                                    pagination:true,
                                                    pageSize:tableOption.pageSize || 10,
                                                    size:'small',
                                                    onRow:tableOption.onRow || undefined,
                                                    rowSelection:tableOption.rowSelection || tableOption.onRowSelect || undefined,
                                                    onRowSelect:tableOption.onRowSelect || undefined,
                                                    columns:tableOption.columns,
                                                    onSuccess:tableOption.onSuccess || undefined,
                                                    scroll:tableOption.scroll || undefined,
                                                    onDataChange:tableOption.onDataChange || undefined,
                                                    renderFooter:tableOption.renderFooter || undefined
                                                }} />
                                </Card>
                            </Col>
                        </Row>
                    </Card>


                </Spin>
                {
                    children? children : null
                }
            </Layout>
        )
    }
}
export default Form.create({
    onValuesChange:(props,values)=>{
        //给外部一个获得搜索条件的回调
        props.searchOption.getFieldsValues && props.searchOption.getFieldsValues(values)
        props.searchOption.onFieldsChange && props.searchOption.onFieldsChange(values)
    }
})(TreeTable)
