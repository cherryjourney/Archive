import { useEffect, useState } from 'react';
import { Tag as AntTag, Input, Popover, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTagStore } from '@/stores/tagStore';
import type { Tag } from '@/types/tags';

interface Props {
  entityType: string;
  entityId: string;
  size?: 'small' | 'default';
}

export default function TagSelect({ entityType, entityId, size = 'small' }: Props) {
  const { tags, entityTags, fetchTags, fetchTagsForEntity, addTagToEntity, removeTagFromEntity, createTag } = useTagStore();
  const [popOpen, setPopOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchTags(); }, []);
  useEffect(() => { if (entityId) fetchTagsForEntity(entityType, entityId); }, [entityId]);

  const current = entityTags[`${entityType}:${entityId}`] || [];

  const handleToggle = async (tag: Tag) => {
    const exists = current.find((t) => t.id === tag.id);
    if (exists) {
      await removeTagFromEntity(tag.id, entityType, entityId);
    } else {
      await addTagToEntity(tag.id, entityType, entityId);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const tag = await createTag({ name: newName.trim() });
      await addTagToEntity(tag.id, entityType, entityId);
      setNewName('');
      message.success(`标签「${tag.name}」已创建`);
    } catch { message.error('创建失败'); }
  };

  const content = (
    <div style={{ maxWidth: 240 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {tags.map((tag) => {
          const active = !!current.find((t) => t.id === tag.id);
          return (
            <AntTag
              key={tag.id}
              color={active ? tag.color : undefined}
              style={{
                cursor: 'pointer', borderRadius: 6, margin: 0,
                border: active ? `1px solid ${tag.color}` : '1px solid #e0dce8',
                background: active ? tag.color : '#fff',
                color: active ? '#fff' : '#6b658b',
              }}
              onClick={() => handleToggle(tag)}
            >
              {tag.name}
            </AntTag>
          );
        })}
      </div>
      <Input
        size="small"
        placeholder="新建标签..."
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onPressEnter={handleCreate}
        style={{ borderRadius: 6 }}
        suffix={<PlusOutlined style={{ color: '#a49ebf', cursor: 'pointer' }} onClick={handleCreate} />}
      />
    </div>
  );

  return (
    <span>
      {current.map((tag) => (
        <AntTag key={tag.id} color={tag.color} style={{ borderRadius: 6, marginRight: 4, cursor: 'pointer' }}
          onClick={() => removeTagFromEntity(tag.id, entityType, entityId)} closable>
          {tag.name}
        </AntTag>
      ))}
      <Popover open={popOpen} onOpenChange={setPopOpen} content={content} trigger="click" placement="bottomLeft">
        <AntTag style={{ borderRadius: 6, border: '1px dashed #d0ccdb', background: 'transparent', color: '#a49ebf', cursor: 'pointer' }}>
          <PlusOutlined /> 标签
        </AntTag>
      </Popover>
    </span>
  );
}
